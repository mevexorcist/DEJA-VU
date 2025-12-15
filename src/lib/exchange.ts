// Exchange integration library for DEJA-VU
// import * as crypto from 'crypto'; // Unused for now
import {
  ExchangeConnection,
  ExchangeCredentials,
  EncryptedCredentials,
  ExchangePortfolio,
  ExchangeAsset,
  QuickTradeRequest,
  QuickTradeResponse,
  ExchangeError,
  ExchangeConnectionStatus,
  SupportedExchange,
  ExchangeConfig,
} from '../types/exchange';
// import { supabase } from './supabase'; // Commented out for testing

// AES-256 encryption configuration
// const ALGORITHM = 'aes-256-gcm';
// const KEY_LENGTH = 32;
// const IV_LENGTH = 16;
const SALT_LENGTH = 32;
// const TAG_LENGTH = 16;

// Exchange configurations
export const EXCHANGE_CONFIGS: Record<SupportedExchange, ExchangeConfig> = {
  binance: {
    name: 'binance',
    displayName: 'Binance',
    apiUrl: 'https://api.binance.com',
    websocketUrl: 'wss://stream.binance.com:9443',
    requiredPermissions: ['spot'],
    supportedFeatures: [
      { name: 'portfolio', enabled: true, permissions: ['spot'] },
      { name: 'trading', enabled: true, permissions: ['spot'] },
      { name: 'history', enabled: true, permissions: ['spot'] },
    ],
    encryptionRequired: true,
  },
  coinbase: {
    name: 'coinbase',
    displayName: 'Coinbase Pro',
    apiUrl: 'https://api.exchange.coinbase.com',
    websocketUrl: 'wss://ws-feed.exchange.coinbase.com',
    requiredPermissions: ['view', 'trade'],
    supportedFeatures: [
      { name: 'portfolio', enabled: true, permissions: ['view'] },
      { name: 'trading', enabled: true, permissions: ['trade'] },
      { name: 'history', enabled: true, permissions: ['view'] },
    ],
    encryptionRequired: true,
  },
  kraken: {
    name: 'kraken',
    displayName: 'Kraken',
    apiUrl: 'https://api.kraken.com',
    requiredPermissions: ['Query Funds', 'Create & Modify Orders'],
    supportedFeatures: [
      { name: 'portfolio', enabled: true, permissions: ['Query Funds'] },
      {
        name: 'trading',
        enabled: true,
        permissions: ['Create & Modify Orders'],
      },
      { name: 'history', enabled: true, permissions: ['Query Funds'] },
    ],
    encryptionRequired: true,
  },
  bybit: {
    name: 'bybit',
    displayName: 'Bybit',
    apiUrl: 'https://api.bybit.com',
    websocketUrl: 'wss://stream.bybit.com',
    requiredPermissions: ['read', 'trade'],
    supportedFeatures: [
      { name: 'portfolio', enabled: true, permissions: ['read'] },
      { name: 'trading', enabled: true, permissions: ['trade'] },
      { name: 'history', enabled: true, permissions: ['read'] },
    ],
    encryptionRequired: true,
  },
};

/**
 * Encrypts exchange API credentials using simple base64 encoding for testing
 */
export function encryptCredentials(
  credentials: ExchangeCredentials,
  masterKey: string
): EncryptedCredentials {
  try {
    // Sanitize master key to avoid issues with special characters
    const sanitizedKey = Buffer.from(masterKey)
      .toString('base64')
      .replace(/[^a-zA-Z0-9]/g, 'X');
    const salt = sanitizedKey
      .slice(0, Math.min(SALT_LENGTH * 2, sanitizedKey.length))
      .padEnd(SALT_LENGTH * 2, '0');
    const iv = Buffer.from('test-iv-12345678').toString('hex');

    // Simple encryption: base64 encode the JSON with sanitized master key
    const credentialsJson = JSON.stringify(credentials);
    const combined = sanitizedKey + '::SEPARATOR::' + credentialsJson;
    const encryptedData = Buffer.from(combined).toString('base64');

    return {
      encryptedData,
      iv,
      salt,
    };
  } catch (error) {
    throw new Error(
      `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Decrypts exchange API credentials using simple base64 decoding for testing
 */
export function decryptCredentials(
  encryptedCreds: EncryptedCredentials,
  masterKey: string
): ExchangeCredentials {
  try {
    // Sanitize master key to match encryption process
    const sanitizedKey = Buffer.from(masterKey)
      .toString('base64')
      .replace(/[^a-zA-Z0-9]/g, 'X');

    // Simple decryption: base64 decode and extract JSON
    const combined = Buffer.from(
      encryptedCreds.encryptedData,
      'base64'
    ).toString('utf8');
    const parts = combined.split('::SEPARATOR::');

    if (parts.length !== 2 || parts[0] !== sanitizedKey) {
      throw new Error('Invalid master key or corrupted data');
    }

    return JSON.parse(parts[1]);
  } catch (error) {
    throw new Error(
      `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Verifies exchange extension and activates API connection
 */
export async function verifyExchangeExtension(
  userId: string,
  exchangeName: SupportedExchange,
  credentials: ExchangeCredentials
): Promise<ExchangeConnection> {
  try {
    // Get exchange configuration
    const config = EXCHANGE_CONFIGS[exchangeName];
    if (!config) {
      throw new Error(`Unsupported exchange: ${exchangeName}`);
    }

    // Encrypt credentials
    const masterKey =
      process.env.EXCHANGE_MASTER_KEY || 'default-key-for-testing';
    const encryptedCreds = encryptCredentials(credentials, masterKey);

    // Test API connection
    const connectionStatus = await testExchangeConnection(
      exchangeName,
      credentials
    );

    // Mock exchange connection record for testing
    const data = {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      exchange_name: exchangeName,
      api_key_hash: encryptedCreds.encryptedData,
      is_active: connectionStatus.isConnected,
      permissions: config.requiredPermissions,
      last_sync_at: connectionStatus.isConnected
        ? new Date().toISOString()
        : null,
      created_at: new Date().toISOString(),
    };

    return {
      id: data.id,
      userId: data.user_id,
      exchangeName: data.exchange_name as SupportedExchange,
      apiKeyHash: data.api_key_hash,
      isActive: data.is_active,
      permissions: data.permissions,
      lastSyncAt: data.last_sync_at ? new Date(data.last_sync_at) : null,
      connectionStatus: connectionStatus.isConnected ? 'connected' : 'error',
      lastError: connectionStatus.error?.message,
      errorCount: connectionStatus.error ? 1 : 0,
      createdAt: new Date(data.created_at),
    };
  } catch (error) {
    throw new Error(
      `Exchange verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Tests exchange API connection
 */
export async function testExchangeConnection(
  exchangeName: SupportedExchange,
  credentials: ExchangeCredentials
): Promise<ExchangeConnectionStatus> {
  try {
    // const config = EXCHANGE_CONFIGS[exchangeName]; // Unused for now

    // Mock API test for now - in real implementation, this would make actual API calls
    // For testing purposes, we'll simulate a successful connection
    const mockLatency = Math.random() * 100 + 50; // 50-150ms

    // Simulate some connection failures for testing
    const shouldFail = Math.random() < 0.1; // 10% failure rate for testing

    if (shouldFail) {
      return {
        isConnected: false,
        lastPing: new Date(),
        latency: null,
        error: {
          code: 'AUTH_FAILED',
          message: 'Invalid API credentials',
          timestamp: new Date(),
          recoverable: true,
        },
      };
    }

    return {
      isConnected: true,
      lastPing: new Date(),
      latency: mockLatency,
      error: undefined,
    };
  } catch (error) {
    return {
      isConnected: false,
      lastPing: new Date(),
      latency: null,
      error: {
        code: 'CONNECTION_ERROR',
        message:
          error instanceof Error ? error.message : 'Unknown connection error',
        timestamp: new Date(),
        recoverable: true,
      },
    };
  }
}

/**
 * Fetches real-time portfolio data from exchange
 */
export async function fetchExchangePortfolio(
  connectionId: string
): Promise<ExchangePortfolio> {
  try {
    // Mock connection details for testing
    const connection = {
      id: connectionId,
      exchange_name: 'binance',
      is_active: true,
    };

    // Mock portfolio data for now - in real implementation, this would fetch from actual exchange APIs
    const mockAssets: ExchangeAsset[] = [
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        balance: 0.5,
        availableBalance: 0.5,
        lockedBalance: 0,
        value: 25000,
        change24h: 2.5,
        price: 50000,
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        balance: 10,
        availableBalance: 8,
        lockedBalance: 2,
        value: 20000,
        change24h: -1.2,
        price: 2000,
      },
    ];

    const totalValue = mockAssets.reduce((sum, asset) => sum + asset.value, 0);

    return {
      exchangeName: connection.exchange_name,
      totalValue,
      currency: 'USD',
      assets: mockAssets,
      lastUpdatedAt: new Date(),
    };
  } catch (error) {
    throw new Error(
      `Failed to fetch portfolio: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Executes quick trade on exchange
 */
export async function executeQuickTrade(
  connectionId: string,
  tradeRequest: QuickTradeRequest
): Promise<QuickTradeResponse> {
  try {
    // Mock connection details for testing
    const connection = {
      id: connectionId,
      exchange_name: 'binance',
      is_active: true,
    };

    if (!connection.is_active) {
      throw new Error('Exchange connection is not active');
    }

    // Mock trade execution for now
    const mockOrderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const executedPrice =
      tradeRequest.price || (tradeRequest.symbol === 'BTC' ? 50000 : 2000);
    const fee = tradeRequest.amount * executedPrice * 0.001; // 0.1% fee

    return {
      orderId: mockOrderId,
      status: 'filled',
      executedAmount: tradeRequest.amount,
      executedPrice,
      fee,
      timestamp: new Date(),
    };
  } catch (error) {
    throw new Error(
      `Trade execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Handles exchange connection errors and provides reconnection
 */
export async function handleExchangeError(
  connectionId: string,
  error: ExchangeError
): Promise<{ reconnected: boolean; newStatus: string }> {
  try {
    // Mock connection details for testing
    const connection = {
      id: connectionId,
      error_count: 0,
      last_sync_at: new Date().toISOString(),
    };

    const newErrorCount = (connection.error_count || 0) + 1;
    const shouldReconnect = error.recoverable && newErrorCount < 5;

    if (shouldReconnect) {
      // Attempt reconnection
      const reconnectionResult = await attemptReconnection(connectionId);

      // Mock database update for testing
      // await supabase.from('exchange_connections').update(...)

      return {
        reconnected: reconnectionResult.success,
        newStatus: reconnectionResult.success ? 'connected' : 'error',
      };
    } else {
      // Mark as disconnected
      // Mock database update for testing
      // await supabase.from('exchange_connections').update(...)

      return {
        reconnected: false,
        newStatus: 'disconnected',
      };
    }
  } catch (error) {
    return {
      reconnected: false,
      newStatus: 'error',
    };
  }
}

/**
 * Attempts to reconnect to exchange
 */
async function attemptReconnection(
  connectionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Mock reconnection attempt
    const success = Math.random() > 0.3; // 70% success rate for testing

    if (success) {
      return { success: true };
    } else {
      return {
        success: false,
        error: 'Reconnection failed - please check your API credentials',
      };
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Unknown reconnection error',
    };
  }
}

/**
 * Disconnects exchange and cleans up data
 */
export async function disconnectExchange(connectionId: string): Promise<void> {
  try {
    // Mock database update for testing
    // await supabase.from('exchange_connections').update(...)
  } catch (error) {
    throw new Error(
      `Disconnection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Gets all exchange connections for a user
 */
export async function getUserExchangeConnections(
  userId: string
): Promise<ExchangeConnection[]> {
  try {
    // Mock data for testing
    const data: any[] = [];

    return (data || []).map((conn) => ({
      id: conn.id,
      userId: conn.user_id,
      exchangeName: conn.exchange_name as SupportedExchange,
      apiKeyHash: conn.api_key_hash,
      isActive: conn.is_active,
      permissions: conn.permissions || [],
      lastSyncAt: conn.last_sync_at ? new Date(conn.last_sync_at) : null,
      connectionStatus: conn.is_active ? 'connected' : 'disconnected',
      errorCount: conn.error_count || 0,
      createdAt: new Date(conn.created_at),
    }));
  } catch (error) {
    throw new Error(
      `Failed to get user exchange connections: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
