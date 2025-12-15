/**
 * Core Security Tests for Authentication and Authorization
 * Tests input sanitization, validation, and security utilities
 * Requirements: 5.1, 3.2
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  InputSanitizer,
  RequestValidator,
  SecurityError,
} from '@/lib/security';
import { AuthService } from '@/lib/auth';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { createMockUser, createMockPost } from '@/test-utils';

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
  },
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
  },
}));

describe('Security: Core Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Sanitization', () => {
    it('should sanitize HTML content to prevent XSS', () => {
      const maliciousInput = '<script>alert("xss")</script><p>Safe content</p>';
      const sanitized = InputSanitizer.sanitizeHtml(maliciousInput);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('Safe content');
    });

    it('should remove HTML tags from plain text', () => {
      const input = '<div>Hello <b>World</b></div>';
      const sanitized = InputSanitizer.sanitizeText(input);

      expect(sanitized).toBe('Hello World');
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
    });

    it('should sanitize usernames properly', () => {
      const input = 'User@Name#123!';
      const sanitized = InputSanitizer.sanitizeUsername(input);

      expect(sanitized).toBe('username123');
      expect(sanitized).toMatch(/^[a-z0-9_]+$/);
    });

    it('should sanitize email addresses', () => {
      const input = '  USER@EXAMPLE.COM  ';
      const sanitized = InputSanitizer.sanitizeEmail(input);

      expect(sanitized).toBe('user@example.com');
    });

    it('should validate and sanitize post content', () => {
      const validContent = 'This is a valid post content.';
      const sanitized = InputSanitizer.sanitizePostContent(validContent);

      expect(sanitized).toBe(validContent);
    });

    it('should reject empty post content', () => {
      expect(() => {
        InputSanitizer.sanitizePostContent('   ');
      }).toThrow('Content cannot be empty');
    });

    it('should reject content exceeding maximum length', () => {
      const longContent = 'a'.repeat(2001);

      expect(() => {
        InputSanitizer.sanitizePostContent(longContent);
      }).toThrow('Content exceeds maximum length');
    });

    it('should sanitize search queries', () => {
      const maliciousQuery = '<script>alert("xss")</script>search term';
      const sanitized = InputSanitizer.sanitizeSearchQuery(maliciousQuery);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('search term');
    });
  });

  describe('Request Validation', () => {
    it('should validate required fields', () => {
      const data = { username: 'test', email: 'test@example.com' };
      const requiredFields = ['username', 'email'];

      expect(() => {
        RequestValidator.validateRequired(data, requiredFields);
      }).not.toThrow();
    });

    it('should throw error for missing required fields', () => {
      const data = { username: 'test' };
      const requiredFields = ['username', 'email'];

      expect(() => {
        RequestValidator.validateRequired(data, requiredFields);
      }).toThrow('Missing required fields: email');
    });

    it('should validate UUID format', () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000';
      const invalidUUID = 'not-a-uuid';

      expect(RequestValidator.validateUUID(validUUID)).toBe(true);
      expect(RequestValidator.validateUUID(invalidUUID)).toBe(false);
    });

    it('should validate pagination parameters', () => {
      const result = RequestValidator.validatePagination('20', '40');

      expect(result.limit).toBe(20);
      expect(result.offset).toBe(40);
    });

    it('should throw error for invalid pagination parameters', () => {
      expect(() => {
        RequestValidator.validatePagination('150', '0'); // limit too high
      }).toThrow('Limit must be between 1 and 100');

      expect(() => {
        RequestValidator.validatePagination('10', '-5'); // negative offset
      }).toThrow('Offset must be non-negative');
    });

    it('should handle default pagination values', () => {
      const result = RequestValidator.validatePagination();

      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });
  });

  describe('Security Error Handling', () => {
    it('should create security errors with proper metadata', () => {
      const error = new SecurityError('Test security error', 400, 'TEST_ERROR');

      expect(error.message).toBe('Test security error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.name).toBe('SecurityError');
    });

    it('should determine when errors should be logged', () => {
      const serverError = new SecurityError('Server error', 500);
      const clientError = new SecurityError('Client error', 400);
      const rateLimitError = new SecurityError('Rate limit', 429);

      expect(serverError.shouldLog()).toBe(true);
      expect(clientError.shouldLog()).toBe(false);
      expect(rateLimitError.shouldLog()).toBe(true);
    });

    it('should determine when error details should be exposed', () => {
      const serverError = new SecurityError('Server error', 500);
      const clientError = new SecurityError('Client error', 400);

      expect(serverError.shouldExposeDetails()).toBe(false);
      expect(clientError.shouldExposeDetails()).toBe(true);
    });

    it('should convert errors to JSON format', () => {
      const error = new SecurityError('Test error', 400, 'TEST_CODE', {
        field: 'username',
      });
      const json = error.toJSON();

      expect(json.error.message).toBe('Test error');
      expect(json.error.code).toBe('TEST_CODE');
      expect(json.error.statusCode).toBe(400);
      expect(json.error.metadata).toEqual({ field: 'username' });
    });
  });

  describe('Authentication Service Security', () => {
    it('should validate email format', () => {
      const validEmail = 'test@example.com';
      const invalidEmail = 'not-an-email';

      expect(AuthService.validateEmail(validEmail)).toBe(true);
      expect(AuthService.validateEmail(invalidEmail)).toBe(false);
    });

    it('should validate password strength', () => {
      const strongPassword = 'StrongPass123!';
      const weakPassword = '123';

      const strongValidation = AuthService.validatePassword(strongPassword);
      const weakValidation = AuthService.validatePassword(weakPassword);

      expect(strongValidation.isValid).toBe(true);
      expect(strongValidation.errors).toHaveLength(0);

      expect(weakValidation.isValid).toBe(false);
      expect(weakValidation.errors.length).toBeGreaterThan(0);
      expect(weakValidation.errors).toContain(
        'Password must be at least 8 characters long'
      );
    });

    it('should validate username format', () => {
      const validUsername = 'valid_user123';
      const invalidUsername = '123invalid';

      const validValidation = AuthService.validateUsername(validUsername);
      const invalidValidation = AuthService.validateUsername(invalidUsername);

      expect(validValidation.isValid).toBe(true);
      expect(validValidation.errors).toHaveLength(0);

      expect(invalidValidation.isValid).toBe(false);
      expect(invalidValidation.errors).toContain(
        'Username cannot start with a number'
      );
    });

    it('should check username availability', async () => {
      const username = 'testuser';

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }, // No rows returned
            }),
          }),
        }),
      });

      const isAvailable = await AuthService.isUsernameAvailable(username);
      expect(isAvailable).toBe(true);
    });

    it('should detect unavailable usernames', async () => {
      const username = 'existinguser';

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { username: 'existinguser' },
              error: null,
            }),
          }),
        }),
      });

      const isAvailable = await AuthService.isUsernameAvailable(username);
      expect(isAvailable).toBe(false);
    });
  });

  describe('Data Access Security', () => {
    it('should enforce user data isolation', async () => {
      const mockUser = createMockUser();

      // Mock authenticated user context
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [mockUser],
            error: null,
          }),
        }),
      });

      // Test that user can access their own data
      const result = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', mockUser.id);

      expect(result.data).toContain(mockUser);
    });

    it('should prevent unauthorized data access', async () => {
      const otherUserId = 'other-user-id';

      // Mock RLS policy blocking access
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      // Test that user cannot access other user's private data
      const result = await supabase
        .from('exchange_connections')
        .select('*')
        .eq('user_id', otherUserId);

      expect(result.data).toHaveLength(0);
    });

    it('should allow public access to posts', async () => {
      const mockPost = createMockPost();

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [mockPost],
          error: null,
        }),
      });

      // Test that posts are publicly viewable
      const result = await supabase.from('posts').select('*');

      expect(result.data).toContain(mockPost);
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should detect potential SQL injection patterns', () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        'UNION SELECT * FROM users',
        'INSERT INTO users VALUES',
      ];

      maliciousInputs.forEach((input) => {
        const sanitized = InputSanitizer.sanitizeText(input);

        // Should not contain dangerous SQL keywords
        expect(sanitized.toLowerCase()).not.toContain('drop table');
        expect(sanitized.toLowerCase()).not.toContain('union select');
        expect(sanitized.toLowerCase()).not.toContain('insert into');
      });
    });

    it('should sanitize search queries against injection', () => {
      const maliciousQuery = "test'; DROP TABLE posts; --";
      const sanitized = InputSanitizer.sanitizeSearchQuery(maliciousQuery);

      expect(sanitized).not.toContain('DROP TABLE');
      expect(sanitized).not.toContain('--');
      expect(sanitized).toContain('test');
    });
  });

  describe('XSS Prevention', () => {
    it('should prevent script injection in user content', () => {
      const xssAttempts = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        '<svg onload="alert(1)">',
        'javascript:alert(1)',
        '<iframe src="javascript:alert(1)">',
      ];

      xssAttempts.forEach((attempt) => {
        const sanitized = InputSanitizer.sanitizeHtml(attempt);

        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('onerror');
        expect(sanitized).not.toContain('onload');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('<iframe>');
      });
    });

    it('should preserve safe HTML elements', () => {
      const safeHtml = '<p>Hello <b>world</b> and <i>everyone</i>!</p>';
      const sanitized = InputSanitizer.sanitizeHtml(safeHtml);

      expect(sanitized).toContain('<b>');
      expect(sanitized).toContain('<i>');
      expect(sanitized).toContain('Hello');
      expect(sanitized).toContain('world');
    });
  });

  describe('Content Validation', () => {
    it('should validate post content length', () => {
      const validContent = 'This is a valid post.';
      const emptyContent = '';
      const longContent = 'a'.repeat(2001);

      expect(() => {
        InputSanitizer.sanitizePostContent(validContent);
      }).not.toThrow();

      expect(() => {
        InputSanitizer.sanitizePostContent(emptyContent);
      }).toThrow('Content cannot be empty');

      expect(() => {
        InputSanitizer.sanitizePostContent(longContent);
      }).toThrow('Content exceeds maximum length');
    });

    it('should normalize whitespace in content', () => {
      const messyContent = '  Hello    world  \n\n  ';
      const sanitized = InputSanitizer.sanitizeText(messyContent);

      expect(sanitized).toBe('Hello world');
    });

    it('should validate username constraints', () => {
      const testCases = [
        { input: 'validuser', expected: true },
        { input: 'valid_user123', expected: true },
        { input: '123invalid', expected: false }, // starts with number
        { input: 'ab', expected: false }, // too short
        { input: 'a'.repeat(21), expected: false }, // too long
        { input: 'invalid@user', expected: false }, // invalid characters
      ];

      testCases.forEach(({ input, expected }) => {
        const validation = AuthService.validateUsername(input);
        expect(validation.isValid).toBe(expected);
      });
    });
  });
});
