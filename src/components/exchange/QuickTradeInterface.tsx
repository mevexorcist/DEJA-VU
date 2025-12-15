'use client';

import React, { useState } from 'react';
import { executeQuickTrade } from '../../lib/exchange';
import { QuickTradeRequest, QuickTradeResponse } from '../../types/exchange';

interface QuickTradeInterfaceProps {
  connectionId: string;
  exchangeName: string;
  isActive: boolean;
  onTradeComplete?: (result: QuickTradeResponse) => void;
  onError?: (error: string) => void;
}

export default function QuickTradeInterface({
  connectionId,
  exchangeName,
  isActive,
  onTradeComplete,
  onError,
}: QuickTradeInterfaceProps) {
  const [tradeRequest, setTradeRequest] = useState<QuickTradeRequest>({
    symbol: 'BTC',
    side: 'buy',
    amount: 0,
    type: 'market',
  });
  const [isTrading, setIsTrading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const popularSymbols = ['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'DOT'];

  const handleTrade = async () => {
    if (!isActive) {
      onError?.('Exchange connection is not active');
      return;
    }

    if (tradeRequest.amount <= 0) {
      onError?.('Please enter a valid amount');
      return;
    }

    if (
      tradeRequest.type === 'limit' &&
      (!tradeRequest.price || tradeRequest.price <= 0)
    ) {
      onError?.('Please enter a valid price for limit order');
      return;
    }

    setIsTrading(true);
    try {
      const result = await executeQuickTrade(connectionId, tradeRequest);
      onTradeComplete?.(result);
      setShowConfirmation(false);
      // Reset form
      setTradeRequest((prev) => ({ ...prev, amount: 0, price: undefined }));
    } catch (error) {
      onError?.(
        error instanceof Error ? error.message : 'Trade execution failed'
      );
    } finally {
      setIsTrading(false);
    }
  };

  const estimatedTotal =
    tradeRequest.type === 'market'
      ? tradeRequest.amount * (tradeRequest.symbol === 'BTC' ? 50000 : 2000) // Mock prices
      : tradeRequest.amount * (tradeRequest.price || 0);

  if (!isActive) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
          Quick Trade - {exchangeName}
        </h3>
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          <p>Exchange connection required for trading</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
        Quick Trade - {exchangeName}
      </h3>

      {!showConfirmation ? (
        <div className="space-y-4">
          {/* Symbol Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Symbol
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {popularSymbols.map((symbol) => (
                <button
                  key={symbol}
                  onClick={() =>
                    setTradeRequest((prev) => ({ ...prev, symbol }))
                  }
                  className={`px-3 py-1 text-sm rounded-lg border ${
                    tradeRequest.symbol === symbol
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  {symbol}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={tradeRequest.symbol}
              onChange={(e) =>
                setTradeRequest((prev) => ({
                  ...prev,
                  symbol: e.target.value.toUpperCase(),
                }))
              }
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              placeholder="Or enter custom symbol"
            />
          </div>

          {/* Side Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Side
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() =>
                  setTradeRequest((prev) => ({ ...prev, side: 'buy' }))
                }
                className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                  tradeRequest.side === 'buy'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Buy
              </button>
              <button
                onClick={() =>
                  setTradeRequest((prev) => ({ ...prev, side: 'sell' }))
                }
                className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                  tradeRequest.side === 'sell'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Sell
              </button>
            </div>
          </div>

          {/* Order Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Order Type
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() =>
                  setTradeRequest((prev) => ({
                    ...prev,
                    type: 'market',
                    price: undefined,
                  }))
                }
                className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                  tradeRequest.type === 'market'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Market
              </button>
              <button
                onClick={() =>
                  setTradeRequest((prev) => ({ ...prev, type: 'limit' }))
                }
                className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                  tradeRequest.type === 'limit'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Limit
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount ({tradeRequest.symbol})
            </label>
            <input
              type="number"
              value={tradeRequest.amount || ''}
              onChange={(e) =>
                setTradeRequest((prev) => ({
                  ...prev,
                  amount: parseFloat(e.target.value) || 0,
                }))
              }
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="0.00"
              step="0.000001"
              min="0"
            />
          </div>

          {/* Price (for limit orders) */}
          {tradeRequest.type === 'limit' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price (USD)
              </label>
              <input
                type="number"
                value={tradeRequest.price || ''}
                onChange={(e) =>
                  setTradeRequest((prev) => ({
                    ...prev,
                    price: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
          )}

          {/* Estimated Total */}
          {tradeRequest.amount > 0 && (
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Estimated Total:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  $
                  {estimatedTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600 dark:text-gray-400">
                  Est. Fee (0.1%):
                </span>
                <span className="text-gray-900 dark:text-white">
                  $
                  {(estimatedTotal * 0.001).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          )}

          {/* Trade Button */}
          <button
            onClick={() => setShowConfirmation(true)}
            disabled={
              tradeRequest.amount <= 0 ||
              (tradeRequest.type === 'limit' &&
                (!tradeRequest.price || tradeRequest.price <= 0))
            }
            className={`w-full py-3 px-4 rounded-lg font-medium ${
              tradeRequest.side === 'buy'
                ? 'bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white'
                : 'bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white'
            }`}
          >
            {tradeRequest.side === 'buy' ? 'Buy' : 'Sell'} {tradeRequest.symbol}
          </button>
        </div>
      ) : (
        /* Confirmation Dialog */
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Confirm Trade
          </h4>

          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Action:</span>
              <span
                className={`font-medium ${
                  tradeRequest.side === 'buy'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {tradeRequest.side.toUpperCase()} {tradeRequest.symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Amount:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {tradeRequest.amount} {tradeRequest.symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Type:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {tradeRequest.type.toUpperCase()}
              </span>
            </div>
            {tradeRequest.type === 'limit' && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Price:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${tradeRequest.price}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-600 dark:text-gray-400">
                Estimated Total:
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                $
                {estimatedTotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setShowConfirmation(false)}
              className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleTrade}
              disabled={isTrading}
              className={`flex-1 py-2 px-4 rounded-lg font-medium text-white ${
                tradeRequest.side === 'buy'
                  ? 'bg-green-600 hover:bg-green-700 disabled:bg-gray-400'
                  : 'bg-red-600 hover:bg-red-700 disabled:bg-gray-400'
              }`}
            >
              {isTrading ? 'Executing...' : 'Confirm Trade'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
