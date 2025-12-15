'use client';

import React, { useState, useEffect } from 'react';
import { fetchExchangePortfolio } from '../../lib/exchange';
import { useRealtimePortfolio } from '../../hooks/useRealtime';
import { ExchangePortfolio, ExchangeAsset } from '../../types/exchange';

interface PortfolioWidgetProps {
  connectionId: string;
  exchangeName: string;
  isActive: boolean;
  userId?: string;
  onError?: (error: string) => void;
}

export default function PortfolioWidget({
  connectionId,
  exchangeName,
  isActive,
  userId,
  onError,
}: PortfolioWidgetProps) {
  const [portfolio, setPortfolio] = useState<ExchangePortfolio | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Real-time portfolio updates
  const { isConnected, portfolio: realtimePortfolio } = useRealtimePortfolio(
    userId || '',
    (updatedPortfolio) => {
      setPortfolio(updatedPortfolio);
      setLastUpdated(new Date());
    }
  );

  // Update portfolio when real-time data changes
  useEffect(() => {
    if (realtimePortfolio) {
      setPortfolio(realtimePortfolio);
      setLastUpdated(new Date());
    }
  }, [realtimePortfolio]);

  const loadPortfolio = async () => {
    if (!isActive) return;

    setIsLoading(true);
    try {
      const portfolioData = await fetchExchangePortfolio(connectionId);
      setPortfolio(portfolioData);
      setLastUpdated(new Date());
    } catch (error) {
      onError?.(
        error instanceof Error ? error.message : 'Failed to load portfolio'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolio();

    // Set up real-time updates every 30 seconds
    const interval = setInterval(loadPortfolio, 30000);
    return () => clearInterval(interval);
  }, [connectionId, isActive, loadPortfolio]);

  const formatCurrency = (value: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  if (!isActive) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {exchangeName} Portfolio
          </h3>
          <span className="text-xs text-red-500 bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded">
            Disconnected
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Exchange connection is not active. Please reconnect to view portfolio.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {exchangeName} Portfolio
        </h3>
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <span className="text-xs text-green-500 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              Live
            </span>
          ) : (
            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              Polling
            </span>
          )}
          <button
            onClick={loadPortfolio}
            disabled={isLoading}
            className="text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400"
          >
            {isLoading ? '↻' : '⟳'}
          </button>
        </div>
      </div>

      {isLoading && !portfolio ? (
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 bg-gray-200 dark:bg-gray-700 rounded"
              ></div>
            ))}
          </div>
        </div>
      ) : portfolio ? (
        <div>
          {/* Total Value */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Value
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(portfolio.totalValue, portfolio.currency)}
            </div>
            {lastUpdated && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Updated {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>

          {/* Assets List */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assets ({portfolio.assets.length})
            </h4>
            {portfolio.assets.map((asset: ExchangeAsset) => (
              <div
                key={asset.symbol}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {asset.symbol}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {asset.name}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {asset.balance.toFixed(6)} {asset.symbol}
                    {asset.lockedBalance > 0 && (
                      <span className="ml-2 text-xs text-yellow-600">
                        ({asset.lockedBalance.toFixed(6)} locked)
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(asset.value)}
                  </div>
                  <div
                    className={`text-sm ${
                      asset.change24h >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatPercentage(asset.change24h)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {portfolio.assets.length === 0 && (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <p>No assets found in this exchange</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          <p>Failed to load portfolio data</p>
          <button
            onClick={loadPortfolio}
            className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
