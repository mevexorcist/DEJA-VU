'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  WalletConnect,
  PortfolioWidget,
  NFTCollection,
} from '@/components/wallet';
import { WalletService } from '@/lib/wallet';
import type { Database } from '@/types/database';
import type { WalletConnection } from '@/types/wallet';

type UserProfile = Database['public']['Tables']['users']['Row'];

interface UserProfileProps {
  user: UserProfile;
  isOwnProfile?: boolean;
  onFollow?: () => void;
  onUnfollow?: () => void;
  isFollowing?: boolean;
  isLoading?: boolean;
}

export function UserProfile({
  user,
  isOwnProfile = false,
  onFollow,
  onUnfollow,
  isFollowing = false,
  isLoading = false,
}: UserProfileProps) {
  const { updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    display_name: user.display_name,
    bio: user.bio || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [walletConnections, setWalletConnections] = useState<
    WalletConnection[]
  >([]);
  const [walletConnected, setWalletConnected] = useState(false);

  useEffect(() => {
    loadWalletConnections();
  }, [user.id]);

  const loadWalletConnections = async () => {
    try {
      const connections = await WalletService.getUserWallets(user.id);
      setWalletConnections(connections);
    } catch (error) {
      console.error('Error loading wallet connections:', error);
    }
  };

  const handleWalletConnectionChange = (connected: boolean) => {
    setWalletConnected(connected);
    if (connected) {
      loadWalletConnections();
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        display_name: editData.display_name,
        bio: editData.bio || null,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFollowClick = () => {
    if (isFollowing) {
      onUnfollow?.();
    } else {
      onFollow?.();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      {/* Profile Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user.display_name.charAt(0).toUpperCase()}
          </div>

          {/* User Info */}
          <div>
            {isEditing ? (
              <input
                type="text"
                value={editData.display_name}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    display_name: e.target.value,
                  }))
                }
                className="text-xl font-bold bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 dark:text-white"
                disabled={isSaving}
              />
            ) : (
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {user.display_name}
                {user.is_verified && (
                  <span className="ml-2 text-blue-500" title="Verified">
                    ✓
                  </span>
                )}
              </h1>
            )}
            <p className="text-gray-600 dark:text-gray-400">@{user.username}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {isOwnProfile ? (
            <div>
              {isEditing ? (
                <div className="space-x-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md text-sm font-medium transition duration-200"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditData({
                        display_name: user.display_name,
                        bio: user.bio || '',
                      });
                    }}
                    disabled={isSaving}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-md text-sm font-medium transition duration-200"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md text-sm font-medium transition duration-200"
                >
                  Edit Profile
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={handleFollowClick}
              disabled={isLoading}
              className={`px-4 py-2 rounded-md text-sm font-medium transition duration-200 ${
                isFollowing
                  ? 'bg-gray-200 hover:bg-red-100 text-gray-700 hover:text-red-600 dark:bg-gray-600 dark:hover:bg-red-900 dark:text-gray-200 dark:hover:text-red-400'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } disabled:opacity-50`}
            >
              {isLoading ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          )}
        </div>
      </div>

      {/* Bio */}
      <div className="mb-4">
        {isEditing ? (
          <textarea
            value={editData.bio}
            onChange={(e) =>
              setEditData((prev) => ({ ...prev, bio: e.target.value }))
            }
            placeholder="Tell us about yourself..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
            maxLength={160}
            disabled={isSaving}
          />
        ) : (
          <p className="text-gray-700 dark:text-gray-300">
            {user.bio ||
              (isOwnProfile
                ? 'Add a bio to tell people about yourself.'
                : 'No bio available.')}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="flex space-x-6 text-sm mb-6">
        <div className="text-center">
          <div className="font-bold text-gray-900 dark:text-white">
            {user.following_count.toLocaleString()}
          </div>
          <div className="text-gray-600 dark:text-gray-400">Following</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-gray-900 dark:text-white">
            {user.follower_count.toLocaleString()}
          </div>
          <div className="text-gray-600 dark:text-gray-400">Followers</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-gray-900 dark:text-white">
            {new Date(user.created_at).toLocaleDateString()}
          </div>
          <div className="text-gray-600 dark:text-gray-400">Joined</div>
        </div>
      </div>

      {/* Wallet Section */}
      {isOwnProfile && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Wallet Connection
          </h3>
          <WalletConnect
            userId={user.id}
            onConnectionChange={handleWalletConnectionChange}
          />

          {/* Display connected wallets */}
          {walletConnections.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Connected Wallets
              </h4>
              <div className="space-y-2">
                {walletConnections.map((wallet, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-mono">
                        {wallet.address.slice(0, 6)}...
                        {wallet.address.slice(-4)}
                      </span>
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                        {wallet.blockchain}
                      </span>
                      {wallet.isVerified && (
                        <span className="text-xs text-green-600 dark:text-green-400">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Portfolio and NFT sections for profiles with connected wallets */}
      {walletConnections.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PortfolioWidget
              userId={user.id}
              walletAddress={walletConnections[0]?.address}
            />
            <NFTCollection
              walletAddress={walletConnections[0]?.address}
              maxDisplay={4}
            />
          </div>
        </div>
      )}
    </div>
  );
}
