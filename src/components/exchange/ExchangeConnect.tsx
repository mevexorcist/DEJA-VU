'use client';

import React, { useState } from 'react';
import { verifyExchangeExtension, EXCHANGE_CONFIGS } from '../../lib/exchange';
import { SupportedExchange, ExchangeCredentials } from '../../types/exchange';

interface ExchangeConnectProps {
  userId: string;
  onConnectionSuccess?: (connectionId: string) => void;
  onConnectionError?: (error: string) => void;
}

export default function ExchangeConnect({
  userId,
  onConnectionSuccess,
  onConnectionError,
}: ExchangeConnectProps) {
  const [selectedExchange, setSelectedExchange] =
    useState<SupportedExchange>('binance');
  const [credentials, setCredentials] = useState<ExchangeCredentials>({
    apiKey: '',
    apiSecret: '',
    passphrase: '',
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);

  const handleConnect = async () => {
    if (!credentials.apiKey || !credentials.apiSecret) {
      onConnectionError?.('Please provide both API key and secret');
      return;
    }

    setIsConnecting(true);
    try {
      const connection = await verifyExchangeExtension(
        userId,
        selectedExchange,
        credentials
      );

      if (connection.connectionStatus === 'connected') {
        onConnectionSuccess?.(connection.id);
        // Clear credentials for security
        setCredentials({ apiKey: '', apiSecret: '', passphrase: '' });
      } else {
        onConnectionError?.(connection.lastError || 'Connection failed');
      }
    } catch (error) {
      onConnectionError?.(
        error instanceof Error ? error.message : 'Connection failed'
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const exchangeConfig = EXCHANGE_CONFIGS[selectedExchange];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Connect Exchange
      </h3>

      {/* Exchange Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Exchange
        </label>
        <select
          value={selectedExchange}
          onChange={(e) =>
            setSelectedExchange(e.target.value as SupportedExchange)
          }
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          disabled={isConnecting}
        >
          {Object.entries(EXCHANGE_CONFIGS).map(([key, config]) => (
            <option key={key} value={key}>
              {config.displayName}
            </option>
          ))}
        </select>
      </div>

      {/* Exchange Info */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          {exchangeConfig.displayName} Requirements
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          {exchangeConfig.requiredPermissions.map((permission, index) => (
            <li key={index} className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              {permission}
            </li>
          ))}
        </ul>
      </div>

      {/* API Credentials */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            API Key
          </label>
          <input
            type={showCredentials ? 'text' : 'password'}
            value={credentials.apiKey}
            onChange={(e) =>
              setCredentials((prev) => ({ ...prev, apiKey: e.target.value }))
            }
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Enter your API key"
            disabled={isConnecting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            API Secret
          </label>
          <input
            type={showCredentials ? 'text' : 'password'}
            value={credentials.apiSecret}
            onChange={(e) =>
              setCredentials((prev) => ({ ...prev, apiSecret: e.target.value }))
            }
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Enter your API secret"
            disabled={isConnecting}
          />
        </div>

        {selectedExchange === 'coinbase' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Passphrase
            </label>
            <input
              type={showCredentials ? 'text' : 'password'}
              value={credentials.passphrase || ''}
              onChange={(e) =>
                setCredentials((prev) => ({
                  ...prev,
                  passphrase: e.target.value,
                }))
              }
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter your passphrase"
              disabled={isConnecting}
            />
          </div>
        )}

        <div className="flex items-center">
          <input
            type="checkbox"
            id="showCredentials"
            checked={showCredentials}
            onChange={(e) => setShowCredentials(e.target.checked)}
            className="mr-2"
            disabled={isConnecting}
          />
          <label
            htmlFor="showCredentials"
            className="text-sm text-gray-600 dark:text-gray-400"
          >
            Show credentials
          </label>
        </div>
      </div>

      {/* Security Notice */}
      <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          🔒 Your API credentials are encrypted with AES-256 encryption before
          storage. We recommend using API keys with limited permissions
          (read-only for portfolio, trade permissions only if needed).
        </p>
      </div>

      {/* Connect Button */}
      <button
        onClick={handleConnect}
        disabled={isConnecting || !credentials.apiKey || !credentials.apiSecret}
        className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
      >
        {isConnecting ? 'Connecting...' : 'Connect Exchange'}
      </button>
    </div>
  );
}
