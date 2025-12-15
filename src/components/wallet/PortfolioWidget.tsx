'use client';

import React, { useState, useEffect } from 'react';
import { WalletService } from '../../lib/wallet';
import type { Portfolio } from '../../types/wallet';

interface PortfolioWidgetProps {
  userId: string;
  walletAddress?: string;
  className?: string;
}

export default function PortfolioWidget({
  userId,
  walletAddress,
  className = '',
}: PortfolioWidgetProps) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (walletAddress) {
      loadPortfolio();
    }
  }, [walletAddress]);

  const loadPortfolio = async () => {
    if (!walletAddress) return;

    setLoading(true);
    setError('');

    try {
      const portfolioData = await WalletService.getWalletBalance(walletAddress);
      portfolioData.userId = userId;
      setPortfolio(portfolioData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number, currency: string) => {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value);
    }
    return `${value.toFixed(4)} ${currency}`;
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    const color = value >= 0 ? 'text-green-500' : 'text-red-500';
    return (
      <span className={color}>
        {sign}
        {value.toFixed(2)}%
      </span>
    );
  };

  if (!walletAddress) {
    return (
      <div
        className={`portfolio-widget bg-gray-100 p-4 rounded-lg ${className}`}
      >
        <h3 className="text-lg font-semibold mb-2">Portfolio</h3>
        <p className="text-gray-500">Connect a wallet to view your portfolio</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={`portfolio-widget bg-white border rounded-lg p-4 ${className}`}
      >
        <h3 className="text-lg font-semibold mb-2">Portfolio</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`portfolio-widget bg-white border rounded-lg p-4 ${className}`}
      >
        <h3 className="text-lg font-semibold mb-2">Portfolio</h3>
        <div className="text-red-500 text-sm">
          <p>{error}</p>
          <button
            onClick={loadPortfolio}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm mt-2 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return null;
  }

  return (
    <div
      className={`portfolio-widget bg-white border rounded-lg p-4 ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Portfolio</h3>
        <button
          onClick={loadPortfolio}
          className="text-gray-500 hover:text-gray-700 text-sm"
          title="Refresh"
        >
          ↻
        </button>
      </div>

      <div className="mb-4">
        <div className="text-2xl font-bold">
          {formatCurrency(portfolio.totalValue, portfolio.currency)}
        </div>
        <div className="text-sm text-gray-500">Total Portfolio Value</div>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium text-gray-700">Assets</h4>
        {portfolio.assets.map((asset, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                {asset.symbol}
              </div>
              <div>
                <div className="font-medium">{asset.name}</div>
                <div className="text-sm text-gray-500">
                  {asset.balance.toFixed(4)} {asset.symbol}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">
                {formatCurrency(asset.value, portfolio.currency)}
              </div>
              <div className="text-sm">{formatPercentage(asset.change24h)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t text-xs text-gray-500">
        Last updated: {portfolio.lastUpdatedAt.toLocaleTimeString()}
      </div>
    </div>
  );
}
