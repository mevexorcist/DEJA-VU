'use client';

import React, { useState } from 'react';
import { handleExchangeError, disconnectExchange } from '../../lib/exchange';
import { ExchangeConnection, ExchangeError } from '../../types/exchange';

interface ExchangeStatusProps {
  connection: ExchangeConnection;
  onStatusUpdate?: (connectionId: string, newStatus: string) => void;
  onDisconnect?: (connectionId: string) => void;
  onError?: (error: string) => void;
}

export default function ExchangeStatus({
  connection,
  onStatusUpdate,
  onDisconnect,
  onError,
}: ExchangeStatusProps) {
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      const mockError: ExchangeError = {
        code: 'CONNECTION_LOST',
        message: 'Connection lost, attempting to reconnect',
        timestamp: new Date(),
        recoverable: true,
      };

      const result = await handleExchangeError(connection.id, mockError);
      onStatusUpdate?.(connection.id, result.newStatus);

      if (!result.reconnected) {
        onError?.('Reconnection failed. Please check your API credentials.');
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Reconnection failed');
    } finally {
      setIsReconnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await disconnectExchange(connection.id);
      onDisconnect?.(connection.id);
    } catch (error) {
      onError?.(
        error instanceof Error ? error.message : 'Disconnection failed'
      );
    } finally {
      setIsDisconnecting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'error':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'reconnecting':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'disconnected':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return '🟢';
      case 'error':
        return '🔴';
      case 'reconnecting':
        return '🟡';
      case 'disconnected':
        return '⚫';
      default:
        return '⚫';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {connection.exchangeName.charAt(0).toUpperCase() +
              connection.exchangeName.slice(1)}
          </h3>
          <span
            className={`text-xs px-2 py-1 rounded-full ${getStatusColor(connection.connectionStatus)}`}
          >
            {getStatusIcon(connection.connectionStatus)}{' '}
            {connection.connectionStatus}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {connection.connectionStatus === 'error' && (
            <button
              onClick={handleReconnect}
              disabled={isReconnecting}
              className="text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-1 rounded"
            >
              {isReconnecting ? 'Reconnecting...' : 'Reconnect'}
            </button>
          )}

          <button
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className="text-xs bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-1 rounded"
          >
            {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
          </button>
        </div>
      </div>

      {/* Connection Details */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Status:</span>
          <span className="text-gray-900 dark:text-white">
            {connection.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Connected:</span>
          <span className="text-gray-900 dark:text-white">
            {connection.createdAt.toLocaleDateString()}
          </span>
        </div>

        {connection.lastSyncAt && (
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Last Sync:</span>
            <span className="text-gray-900 dark:text-white">
              {connection.lastSyncAt.toLocaleString()}
            </span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Permissions:</span>
          <span className="text-gray-900 dark:text-white">
            {connection.permissions.length} granted
          </span>
        </div>

        {connection.errorCount > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">
              Error Count:
            </span>
            <span className="text-red-600 dark:text-red-400">
              {connection.errorCount}
            </span>
          </div>
        )}
      </div>

      {/* Permissions List */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Permissions
        </h4>
        <div className="flex flex-wrap gap-1">
          {connection.permissions.map((permission, index) => (
            <span
              key={index}
              className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 px-2 py-1 rounded"
            >
              {permission}
            </span>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {connection.lastError && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">
            Last Error
          </h4>
          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
            {connection.lastError}
          </p>
        </div>
      )}

      {/* Connection Health */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Connection Health
          </span>
          <div className="flex items-center space-x-2">
            {connection.connectionStatus === 'connected' && (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 dark:text-green-400">
                  Healthy
                </span>
              </>
            )}
            {connection.connectionStatus === 'error' && (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-xs text-red-600 dark:text-red-400">
                  Error
                </span>
              </>
            )}
            {connection.connectionStatus === 'disconnected' && (
              <>
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Disconnected
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
