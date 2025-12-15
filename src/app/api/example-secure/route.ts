import { NextRequest, NextResponse } from 'next/server';
import { asyncHandler, Errors } from '@/lib/error-handler';
import { InputSanitizer, RequestValidator } from '@/lib/security';
import { CacheManager } from '@/lib/cache';
import { withPerformanceMonitoring } from '@/lib/performance';
import { supabase } from '@/lib/supabase';

// Example secure API route with all optimizations
export const GET = asyncHandler(async (req: NextRequest) => {
  // Extract and validate query parameters
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');
  const limitStr = searchParams.get('limit');
  const offsetStr = searchParams.get('offset');

  // Validate required parameters
  if (!query) {
    throw Errors.validation('Search query is required', 'q');
  }

  // Sanitize input
  const sanitizedQuery = InputSanitizer.sanitizeSearchQuery(query);

  // Validate pagination
  const { limit, offset } = RequestValidator.validatePagination(
    limitStr || undefined,
    offsetStr || undefined
  );

  // Use caching for search results
  const searchResults = await CacheManager.cacheSearch(
    sanitizedQuery,
    'posts',
    Math.floor(offset / limit), // page number
    async () => {
      return await performSearch(sanitizedQuery, limit, offset);
    },
    300 // 5 minutes cache
  );

  return NextResponse.json({
    success: true,
    data: searchResults,
    pagination: {
      limit,
      offset,
      hasMore: searchResults.length === limit,
    },
  });
});

export const POST = asyncHandler(async (req: NextRequest) => {
  // Validate content type
  RequestValidator.validateContentType(req, 'application/json');

  // Parse and validate request body
  const body = await req.json();
  RequestValidator.validateRequired(body, ['title', 'content']);

  // Sanitize input data
  const sanitizedData = {
    title: InputSanitizer.sanitizeText(body.title),
    content: InputSanitizer.sanitizePostContent(body.content),
    tags:
      body.tags?.map((tag: string) => InputSanitizer.sanitizeText(tag)) || [],
  };

  // Create post with performance monitoring
  const result = await withPerformanceMonitoring('create_post', async () => {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        title: sanitizedData.title,
        content: sanitizedData.content,
        hashtags: sanitizedData.tags,
        author_id: 'user-id', // Would come from auth
      })
      .select()
      .single();

    if (error) throw Errors.database('Failed to create post', error);
    return data;
  })();

  // Invalidate related caches
  CacheManager.invalidatePost(result.id, result.author_id);

  return NextResponse.json(
    {
      success: true,
      data: result,
    },
    { status: 201 }
  );
});

// Helper function with performance monitoring
const performSearch = withPerformanceMonitoring(
  'search_posts',
  async (query: string, limit: number, offset: number) => {
    const { data, error } = await supabase
      .from('posts')
      .select(
        `
      id,
      title,
      content,
      hashtags,
      created_at,
      author:users(username, display_name, avatar_url)
    `
      )
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw Errors.database('Search failed', error);
    return data || [];
  }
);

// Rate limiting would be handled by middleware
// Authentication would be handled by middleware
// Security headers would be added by middleware
