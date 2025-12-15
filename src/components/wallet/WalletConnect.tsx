'use client';

import React, { useState, useEffect } from 'react';
import { WalletService } from '../../lib/wallet';
import type {
  WalletConnectionStatus,
  ConnectedWallet,
} from '../../types/wallet';

interface WalletConnectProps {
  userId: string;
  onConnectionChange?: (connected: boolean) => void;
}

export default function WalletConnect({
  userId,
  onConnectionChange,
}: WalletConnectProps) {
  const [status, setStatus] = useState<WalletConnectionStatus>('disconnected');
  const [connectedWallet, setConnectedWallet] =
    useState<ConnectedWallet | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Check if wallet is already connected
    if (WalletService.isWalletConnected()) {
      const address = WalletService.getConnectedAddress();
      if (address) {
        setConnectedWallet({
          address,
          blockchain: 'ethereum',
          provider: (window as any).ethereum,
          isConnected: true,
        });
        setStatus('connected');
      }
    }
  }, []);

  const handleConnect = async () => {
    setStatus('connecting');
    setError('');

    try {
      const wallet = await WalletService.connectWallet();
      setConnectedWallet(wallet);

      // Verify wallet ownership
      const isVerified = await WalletService.verifyWalletSignature(
        userId,
        wallet.address
      );

      if (isVerified) {
        setStatus('connected');
        onConnectionChange?.(true);
      } else {
        setStatus('error');
        setError('Wallet verification failed');
      }
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    }
  };

  const handleDisconnect = async () => {
    try {
      if (connectedWallet) {
        await WalletService.disconnectWallet(userId, connectedWallet.address);
      }
      setConnectedWallet(null);
      setStatus('disconnected');
      onConnectionChange?.(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to disconnect wallet'
      );
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="wallet-connect">
      {status === 'disconnected' && (
        <button
          onClick={handleConnect}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Connect Wallet
        </button>
      )}

      {status === 'connecting' && (
        <button
          disabled
          className="bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed"
        >
          Connecting...
        </button>
      )}

      {status === 'connected' && connectedWallet && (
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">
              {formatAddress(connectedWallet.address)}
            </span>
          </div>
          <button
            onClick={handleDisconnect}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="text-red-500 text-sm">
          <p>{error}</p>
          <button
            onClick={handleConnect}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg mt-2 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
