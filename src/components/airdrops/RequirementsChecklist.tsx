'use client';

import React from 'react';
import type { AirdropRequirement } from '../../types/airdrop';

interface RequirementsChecklistProps {
  requirements: AirdropRequirement[];
  completedRequirements?: string[];
  compact?: boolean;
  onRequirementToggle?: (requirementId: string, completed: boolean) => void;
  className?: string;
}

const RequirementsChecklist: React.FC<RequirementsChecklistProps> = ({
  requirements,
  completedRequirements = [],
  compact = false,
  onRequirementToggle,
  className = '',
}) => {
  const isCompleted = (requirementId: string) => {
    return completedRequirements.includes(requirementId);
  };

  const getVerificationIcon = (method: string) => {
    switch (method) {
      case 'wallet':
        return '🔗';
      case 'social':
        return '📱';
      case 'manual':
        return '✋';
      default:
        return '📋';
    }
  };

  const getVerificationText = (method: string) => {
    switch (method) {
      case 'wallet':
        return 'Wallet Verification';
      case 'social':
        return 'Social Verification';
      case 'manual':
        return 'Manual Verification';
      default:
        return 'Verification Required';
    }
  };

  const completedCount = requirements.filter((req) =>
    isCompleted(req.id)
  ).length;
  const totalCount = requirements.length;
  const progressPercentage =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (compact) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Requirements
          </span>
          <span className="text-sm text-gray-500">
            {completedCount}/{totalCount} completed
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Compact Requirements List */}
        <div className="space-y-1">
          {requirements.slice(0, 3).map((requirement) => (
            <div
              key={requirement.id}
              className="flex items-center space-x-2 text-sm"
            >
              <div
                className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                  isCompleted(requirement.id)
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300'
                }`}
              >
                {isCompleted(requirement.id) && (
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <span
                className={`flex-1 ${isCompleted(requirement.id) ? 'line-through text-gray-500' : 'text-gray-700'}`}
              >
                {requirement.description}
              </span>
            </div>
          ))}

          {requirements.length > 3 && (
            <div className="text-xs text-gray-500 pl-6">
              +{requirements.length - 3} more requirements
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900">
          Requirements Checklist
        </h4>
        <span className="text-sm text-gray-500">
          {completedCount}/{totalCount} completed
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-500">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Requirements List */}
      <div className="space-y-4">
        {requirements.map((requirement) => (
          <div
            key={requirement.id}
            className={`p-4 border rounded-lg transition-all ${
              isCompleted(requirement.id)
                ? 'bg-green-50 border-green-200'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start space-x-3">
              {/* Checkbox */}
              <button
                onClick={() =>
                  onRequirementToggle?.(
                    requirement.id,
                    !isCompleted(requirement.id)
                  )
                }
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  isCompleted(requirement.id)
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                disabled={!onRequirementToggle}
              >
                {isCompleted(requirement.id) && (
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>

              {/* Content */}
              <div className="flex-1">
                <p
                  className={`font-medium ${
                    isCompleted(requirement.id)
                      ? 'line-through text-gray-500'
                      : 'text-gray-900'
                  }`}
                >
                  {requirement.description}
                </p>

                {requirement.required_value && (
                  <p className="text-sm text-gray-600 mt-1">
                    Required: {requirement.required_value}
                  </p>
                )}

                {/* Verification Method */}
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-sm">
                    {getVerificationIcon(requirement.verification_method)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {getVerificationText(requirement.verification_method)}
                  </span>
                </div>
              </div>

              {/* Status */}
              {isCompleted(requirement.id) && (
                <div className="text-green-600">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Completion Status */}
      {completedCount === totalCount && totalCount > 0 && (
        <div className="mt-6 p-4 bg-green-100 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg
              className="w-5 h-5 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium text-green-800">
              All requirements completed! 🎉
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequirementsChecklist;
