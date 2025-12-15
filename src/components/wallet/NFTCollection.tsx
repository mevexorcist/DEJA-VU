'use client';

import React, { useState, useEffect } from 'react';
import { WalletService } from '../../lib/wallet';
import type { NFT } from '../../types/wallet';

interface NFTCollectionProps {
  walletAddress?: string;
  className?: string;
  maxDisplay?: number;
}

export default function NFTCollection({
  walletAddress,
  className = '',
  maxDisplay = 6,
}: NFTCollectionProps) {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      loadNFTs();
    }
  }, [walletAddress]);

  const loadNFTs = async () => {
    if (!walletAddress) return;

    setLoading(true);
    setError('');

    try {
      const nftData = await WalletService.getNFTCollection(walletAddress);
      setNfts(nftData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load NFT collection'
      );
    } finally {
      setLoading(false);
    }
  };

  const displayedNFTs = showAll ? nfts : nfts.slice(0, maxDisplay);
  const hasMore = nfts.length > maxDisplay;

  if (!walletAddress) {
    return (
      <div className={`nft-collection bg-gray-100 p-4 rounded-lg ${className}`}>
        <h3 className="text-lg font-semibold mb-2">NFT Collection</h3>
        <p className="text-gray-500">Connect a wallet to view your NFTs</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={`nft-collection bg-white border rounded-lg p-4 ${className}`}
      >
        <h3 className="text-lg font-semibold mb-3">NFT Collection</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-lg mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`nft-collection bg-white border rounded-lg p-4 ${className}`}
      >
        <h3 className="text-lg font-semibold mb-2">NFT Collection</h3>
        <div className="text-red-500 text-sm">
          <p>{error}</p>
          <button
            onClick={loadNFTs}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm mt-2 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div
        className={`nft-collection bg-white border rounded-lg p-4 ${className}`}
      >
        <h3 className="text-lg font-semibold mb-2">NFT Collection</h3>
        <p className="text-gray-500">No NFTs found in this wallet</p>
      </div>
    );
  }

  return (
    <div
      className={`nft-collection bg-white border rounded-lg p-4 ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">NFT Collection</h3>
        <span className="text-sm text-gray-500">{nfts.length} items</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {displayedNFTs.map((nft, index) => (
          <div
            key={`${nft.contractAddress}-${nft.tokenId}`}
            className="nft-item"
          >
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
              <img
                src={nft.imageUrl}
                alt={nft.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/300x300?text=NFT';
                }}
              />
            </div>
            <div className="text-sm">
              <div className="font-medium truncate" title={nft.name}>
                {nft.name}
              </div>
              <div className="text-gray-500 truncate" title={nft.collection}>
                {nft.collection}
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-blue-500 hover:text-blue-600 text-sm font-medium"
          >
            {showAll ? 'Show Less' : `Show All (${nfts.length})`}
          </button>
        </div>
      )}
    </div>
  );
}
