// Wallet integration service for DEJA-VU
import { ethers } from 'ethers';
import { supabase } from './supabase';
import type {
  WalletConnection,
  WalletSignatureRequest,
  WalletProvider,
  ConnectedWallet,
  Portfolio,
  NFT,
} from '../types/wallet';

export class WalletService {
  private static provider: ethers.BrowserProvider | null = null;
  private static connectedWallet: ConnectedWallet | null = null;

  /**
   * Connect to MetaMask or other Web3 wallet
   */
  static async connectWallet(): Promise<ConnectedWallet> {
    if (typeof window === 'undefined') {
      throw new Error('Wallet connection only available in browser');
    }

    const ethereum = (window as any).ethereum as WalletProvider;
    if (!ethereum) {
      throw new Error('No Web3 wallet found. Please install MetaMask.');
    }

    try {
      // Request account access
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];
      this.provider = new ethers.BrowserProvider(ethereum);

      this.connectedWallet = {
        address,
        blockchain: 'ethereum',
        provider: ethereum,
        isConnected: true,
      };

      return this.connectedWallet;
    } catch (error) {
      throw new Error(
        `Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Verify wallet ownership through signature
   */
  static async verifyWalletSignature(
    userId: string,
    address: string
  ): Promise<boolean> {
    if (!this.provider) {
      throw new Error('No wallet connected');
    }

    try {
      const signer = await this.provider.getSigner();
      const signerAddress = await signer.getAddress();

      // Verify the address matches
      if (signerAddress.toLowerCase() !== address.toLowerCase()) {
        throw new Error('Address mismatch');
      }

      // Create verification message
      const message = `Verify wallet ownership for DEJA-VU\nUser ID: ${userId}\nTimestamp: ${Date.now()}`;

      // Request signature
      const signature = await signer.signMessage(message);

      // Verify signature
      const recoveredAddress = ethers.verifyMessage(message, signature);
      const isValid = recoveredAddress.toLowerCase() === address.toLowerCase();

      if (isValid) {
        // Save verified wallet connection to database
        await this.saveWalletConnection(userId, address, 'ethereum', true);
      }

      return isValid;
    } catch (error) {
      console.error('Wallet verification failed:', error);
      return false;
    }
  }

  /**
   * Save wallet connection to database
   */
  static async saveWalletConnection(
    userId: string,
    address: string,
    blockchain: string,
    isVerified: boolean = false
  ): Promise<void> {
    const { error } = await supabase.from('wallet_connections').upsert({
      user_id: userId,
      address,
      blockchain,
      is_verified: isVerified,
      connected_at: new Date().toISOString(),
    });

    if (error) {
      throw new Error(`Failed to save wallet connection: ${error.message}`);
    }
  }

  /**
   * Get user's wallet connections
   */
  static async getUserWallets(userId: string): Promise<WalletConnection[]> {
    const { data, error } = await supabase
      .from('wallet_connections')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch wallet connections: ${error.message}`);
    }

    return (data || []).map((wallet) => ({
      userId: wallet.user_id,
      address: wallet.address,
      blockchain: wallet.blockchain as any,
      isVerified: wallet.is_verified,
      connectedAt: new Date(wallet.connected_at),
    }));
  }

  /**
   * Disconnect wallet and cleanup data
   */
  static async disconnectWallet(
    userId: string,
    address?: string
  ): Promise<void> {
    try {
      // If specific address provided, remove only that wallet
      if (address) {
        const { error } = await supabase
          .from('wallet_connections')
          .delete()
          .eq('user_id', userId)
          .eq('address', address);

        if (error) {
          throw new Error(`Failed to disconnect wallet: ${error.message}`);
        }
      } else {
        // Remove all wallet connections for user
        const { error } = await supabase
          .from('wallet_connections')
          .delete()
          .eq('user_id', userId);

        if (error) {
          throw new Error(`Failed to disconnect all wallets: ${error.message}`);
        }
      }

      // Clear local state
      this.provider = null;
      this.connectedWallet = null;
    } catch (error) {
      throw new Error(
        `Failed to disconnect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get wallet balance (mock implementation)
   */
  static async getWalletBalance(address: string): Promise<Portfolio> {
    if (!this.provider) {
      throw new Error('No wallet connected');
    }

    try {
      // Get ETH balance
      const balance = await this.provider.getBalance(address);
      const ethBalance = parseFloat(ethers.formatEther(balance));

      // Mock USD price for ETH (in real implementation, fetch from price API)
      const ethPrice = 2000; // $2000 per ETH
      const totalValue = ethBalance * ethPrice;

      return {
        userId: '', // Will be set by caller
        totalValue,
        currency: 'USD',
        assets: [
          {
            symbol: 'ETH',
            name: 'Ethereum',
            balance: ethBalance,
            value: totalValue,
            change24h: 0, // Mock value
          },
        ],
        lastUpdatedAt: new Date(),
      };
    } catch (error) {
      throw new Error(
        `Failed to get wallet balance: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get NFT collection (mock implementation)
   */
  static async getNFTCollection(address: string): Promise<NFT[]> {
    // Mock NFT data - in real implementation, use OpenSea API or similar
    return [
      {
        tokenId: '1',
        contractAddress: '0x1234567890123456789012345678901234567890',
        name: 'Sample NFT #1',
        description: 'A sample NFT for testing',
        imageUrl: 'https://via.placeholder.com/300x300',
        blockchain: 'ethereum',
        collection: 'Sample Collection',
      },
    ];
  }

  /**
   * Check if wallet is connected
   */
  static isWalletConnected(): boolean {
    return this.connectedWallet?.isConnected || false;
  }

  /**
   * Get connected wallet address
   */
  static getConnectedAddress(): string | null {
    return this.connectedWallet?.address || null;
  }

  /**
   * Validate wallet address format
   */
  static isValidAddress(address: string): boolean {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }
}
