'use client';

import React from 'react';
import type { AirdropFeedItem } from '../../types/airdrop';
import CountdownTimer from './CountdownTimer';
import RequirementsChecklist from './RequirementsChecklist';
import AirdropBookmark from './AirdropBookmark';

interface AirdropCardProps {
  airdrop: AirdropFeedItem;
  userId?: string;
  onBookmarkToggle?: (airdropId: string, isBookmarked: boolean) => void;
  className?: string;
}

const AirdropCard: React.FC<AirdropCardProps> = ({
  airdrop,
  userId,
  onBookmarkToggle,
  className = '',
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ended':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'upcoming':
        return 'Upcoming';
      case 'ended':
        return 'Ended';
      default:
        return status;
    }
  };

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4">
          {/* Logo */}
          {airdrop.logo_url && (
            <img
              src={airdrop.logo_url}
              alt={`${airdrop.project_name} logo`}
              className="w-12 h-12 rounded-full object-cover"
            />
          )}

          {/* Title and Project */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {airdrop.title}
            </h3>
            <p className="text-gray-600 font-medium">{airdrop.project_name}</p>
            {airdrop.blockchain && (
              <span className="inline-block mt-1 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                {airdrop.blockchain}
              </span>
            )}
          </div>
        </div>

        {/* Status and Bookmark */}
        <div className="flex items-center space-x-2">
          <span
            className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(airdrop.status)}`}
          >
            {getStatusText(airdrop.status)}
          </span>

          {userId && onBookmarkToggle && (
            <AirdropBookmark
              airdropId={airdrop.id}
              isBookmarked={airdrop.is_bookmarked}
              onToggle={onBookmarkToggle}
            />
          )}
        </div>
      </div>

      {/* Description */}
      {airdrop.description && (
        <p className="text-gray-700 mb-4 line-clamp-2">{airdrop.description}</p>
      )}

      {/* Reward and Eligibility */}
      <div className="flex items-center justify-between mb-4">
        {airdrop.estimated_reward && (
          <div className="text-sm">
            <span className="text-gray-500">Estimated Reward: </span>
            <span className="font-semibold text-green-600">
              {airdrop.estimated_reward}
            </span>
          </div>
        )}

        {airdrop.is_eligible && (
          <span className="text-sm text-green-600 font-medium">✓ Eligible</span>
        )}
      </div>

      {/* Countdown Timer */}
      {airdrop.status === 'active' &&
        airdrop.time_remaining &&
        airdrop.time_remaining > 0 && (
          <div className="mb-4">
            <CountdownTimer endDate={airdrop.end_date!} className="text-sm" />
          </div>
        )}

      {/* Requirements Checklist */}
      {airdrop.requirements && airdrop.requirements.length > 0 && (
        <div className="mb-4">
          <RequirementsChecklist
            requirements={airdrop.requirements}
            completedRequirements={
              airdrop.user_status?.completed_requirements || []
            }
            compact={true}
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          {airdrop.start_date && (
            <>Started: {new Date(airdrop.start_date).toLocaleDateString()}</>
          )}
          {airdrop.end_date && (
            <> • Ends: {new Date(airdrop.end_date).toLocaleDateString()}</>
          )}
        </div>

        <div className="flex space-x-2">
          {airdrop.status === 'active' && (
            <button className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
              Participate
            </button>
          )}

          <button className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
            View Details
          </button>
        </div>
      </div>

      {/* User Status */}
      {airdrop.user_status && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Status:{' '}
              <span className="font-medium capitalize">
                {airdrop.user_status.status}
              </span>
            </span>
            {airdrop.user_status.bookmarked_at && (
              <span className="text-gray-500">
                Bookmarked{' '}
                {new Date(
                  airdrop.user_status.bookmarked_at
                ).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AirdropCard;
