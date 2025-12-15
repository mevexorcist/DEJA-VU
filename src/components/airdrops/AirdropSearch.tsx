'use client';

import React, { useState } from 'react';
import type { AirdropFilters } from '../../types/airdrop';

interface AirdropSearchProps {
  filters: AirdropFilters;
  onFiltersChange: (filters: AirdropFilters) => void;
  showBookmarkedToggle?: boolean;
  showBookmarkedOnly?: boolean;
  className?: string;
}

const AirdropSearch: React.FC<AirdropSearchProps> = ({
  filters,
  onFiltersChange,
  showBookmarkedToggle = false,
  showBookmarkedOnly = false,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.search_term || '');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({
      ...filters,
      search_term: searchTerm.trim() || undefined,
    });
  };

  const handleStatusChange = (status: string) => {
    onFiltersChange({
      ...filters,
      status: status as AirdropFilters['status'],
    });
  };

  const handleBlockchainChange = (blockchain: string) => {
    onFiltersChange({
      ...filters,
      blockchain: blockchain || undefined,
    });
  };

  const handleEligibleOnlyToggle = () => {
    onFiltersChange({
      ...filters,
      eligible_only: !filters.eligible_only,
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    onFiltersChange({
      status: 'active',
    });
  };

  const blockchainOptions = [
    { value: '', label: 'All Blockchains' },
    { value: 'ethereum', label: 'Ethereum' },
    { value: 'bitcoin', label: 'Bitcoin' },
    { value: 'solana', label: 'Solana' },
    { value: 'polygon', label: 'Polygon' },
    { value: 'binance', label: 'Binance Smart Chain' },
    { value: 'avalanche', label: 'Avalanche' },
    { value: 'arbitrum', label: 'Arbitrum' },
    { value: 'optimism', label: 'Optimism' },
  ];

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-4 space-y-4 ${className}`}
    >
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex space-x-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search airdrops by title or project name..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Search
        </button>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={filters.status || 'active'}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="ended">Ended</option>
          </select>
        </div>

        {/* Blockchain Filter */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">
            Blockchain:
          </label>
          <select
            value={filters.blockchain || ''}
            onChange={(e) => handleBlockchainChange(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {blockchainOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Eligible Only Toggle */}
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.eligible_only || false}
            onChange={handleEligibleOnlyToggle}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Eligible only</span>
        </label>

        {/* Clear Filters */}
        <button
          onClick={clearFilters}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Clear filters
        </button>
      </div>

      {/* Active Filters Display */}
      {(filters.search_term ||
        filters.blockchain ||
        filters.status !== 'active' ||
        filters.eligible_only) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500">Active filters:</span>

          {filters.search_term && (
            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
              Search: &quot;{filters.search_term}&quot;
              <button
                onClick={() => {
                  setSearchTerm('');
                  onFiltersChange({ ...filters, search_term: undefined });
                }}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          )}

          {filters.blockchain && (
            <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
              {
                blockchainOptions.find(
                  (opt) => opt.value === filters.blockchain
                )?.label
              }
              <button
                onClick={() =>
                  onFiltersChange({ ...filters, blockchain: undefined })
                }
                className="ml-1 text-purple-600 hover:text-purple-800"
              >
                ×
              </button>
            </span>
          )}

          {filters.status && filters.status !== 'active' && (
            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded capitalize">
              {filters.status}
              <button
                onClick={() =>
                  onFiltersChange({ ...filters, status: 'active' })
                }
                className="ml-1 text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </span>
          )}

          {filters.eligible_only && (
            <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
              Eligible only
              <button
                onClick={() =>
                  onFiltersChange({ ...filters, eligible_only: false })
                }
                className="ml-1 text-yellow-600 hover:text-yellow-800"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}

      {/* Bookmarked Toggle (if enabled) */}
      {showBookmarkedToggle && (
        <div className="pt-2 border-t border-gray-100">
          <div className="text-sm text-gray-600">
            {showBookmarkedOnly
              ? 'Showing bookmarked airdrops only'
              : 'Showing all airdrops'}
          </div>
        </div>
      )}
    </div>
  );
};

export default AirdropSearch;
