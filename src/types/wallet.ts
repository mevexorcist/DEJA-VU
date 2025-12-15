// Wallet integration types for DEJA-VU

export interface WalletConnection {
  userId: string;
  address: string;
  blockchain: 'ethereum' | 'bitcoin' | 'solana' | 'polygon';
  isVerified: boolean;
  connectedAt: Date;
}

export interface NFT {
  tokenId: string;
  contractAddress: string;
  name: string;
  description?: string;
  imageUrl: string;
  blockchain: string;
  collection: string;
}

export interface Portfolio {
  userId: string;
  totalValue: number;
  currency: 'USD' | 'BTC' | 'ETH';
  assets: Asset[];
  lastUpdatedAt: Date;
}

export interface Asset {
  symbol: string;
  name: string;
  balance: number;
  value: number;
  change24h: number;
  exchange?: string;
}

export interface WalletSignatureRequest {
  message: string;
  address: string;
  signature: string;
}

export interface WalletProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
}

export interface ConnectedWallet {
  address: string;
  blockchain: string;
  provider: WalletProvider;
  isConnected: boolean;
}

export type WalletConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

export interface WalletState {
  status: WalletConnectionStatus;
  connectedWallet?: ConnectedWallet;
  error?: string;
}
