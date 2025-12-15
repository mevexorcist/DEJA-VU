// Exchange integration types for DEJA-VU

export interface ExchangeConnection {
  id: string;
  userId: string;
  exchangeName: string;
  apiKeyHash: string; // Encrypted
  isActive: boolean;
  permissions: string[];
  lastSyncAt: Date | null;
  connectionStatus: 'connected' | 'error' | 'disconnected' | 'reconnecting';
  lastError?: string;
  errorCount: number;
  createdAt: Date;
}

export interface ExchangeCredentials {
  apiKey: string;
  apiSecret: string;
  passphrase?: string; // For some exchanges like Coinbase Pro
}

export interface EncryptedCredentials {
  encryptedData: string;
  iv: string;
  salt: string;
}

export interface ExchangeAPI {
  name: string;
  baseUrl: string;
  supportedFeatures: ExchangeFeature[];
  rateLimits: RateLimit[];
}

export interface ExchangeFeature {
  name: 'portfolio' | 'trading' | 'history' | 'deposits' | 'withdrawals';
  enabled: boolean;
  permissions: string[];
}

export interface RateLimit {
  endpoint: string;
  requestsPerMinute: number;
  requestsPerHour: number;
}

export interface ExchangePortfolio {
  exchangeName: string;
  totalValue: number;
  currency: 'USD' | 'BTC' | 'ETH';
  assets: ExchangeAsset[];
  lastUpdatedAt: Date;
}

export interface ExchangeAsset {
  symbol: string;
  name: string;
  balance: number;
  availableBalance: number;
  lockedBalance: number;
  value: number;
  change24h: number;
  price: number;
}

export interface QuickTradeRequest {
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  type: 'market' | 'limit';
  price?: number;
}

export interface QuickTradeResponse {
  orderId: string;
  status: 'pending' | 'filled' | 'cancelled' | 'error';
  executedAmount: number;
  executedPrice: number;
  fee: number;
  timestamp: Date;
}

export interface ExchangeError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  recoverable: boolean;
}

export interface ExchangeConnectionStatus {
  isConnected: boolean;
  lastPing: Date | null;
  latency: number | null;
  error?: ExchangeError;
}

export type SupportedExchange = 'binance' | 'coinbase' | 'kraken' | 'bybit';

export interface ExchangeConfig {
  name: SupportedExchange;
  displayName: string;
  apiUrl: string;
  websocketUrl?: string;
  requiredPermissions: string[];
  supportedFeatures: ExchangeFeature[];
  encryptionRequired: boolean;
}
