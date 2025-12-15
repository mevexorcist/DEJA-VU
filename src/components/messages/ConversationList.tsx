'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MessageService } from '@/lib/database';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  id: string;
  participant1: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  participant2: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  last_activity: string;
  is_active: boolean;
}

interface ConversationListProps {
  onConversationSelect: (conversationId: string, otherUser: any) => void;
  selectedConversationId?: string;
}

export default function ConversationList({
  onConversationSelect,
  selectedConversationId,
}: ConversationListProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userConversations = await MessageService.getUserConversations(
        user.id
      );
      setConversations(userConversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const getOtherUser = (conversation: Conversation) => {
    return conversation.participant1.id === user?.id
      ? conversation.participant2
      : conversation.participant1;
  };

  if (!user) {
    return (
      <div className="p-4 text-center text-gray-500">
        Please log in to view messages
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500 mb-2">{error}</p>
        <button
          onClick={loadConversations}
          className="text-blue-500 hover:text-blue-600 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p className="mb-2">No conversations yet</p>
        <p className="text-sm">
          Start a conversation with someone you follow who also follows you back
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {conversations.map((conversation) => {
        const otherUser = getOtherUser(conversation);
        const isSelected = selectedConversationId === conversation.id;

        return (
          <div
            key={conversation.id}
            onClick={() => onConversationSelect(conversation.id, otherUser)}
            className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
              isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
            }`}
          >
            <div className="flex items-center space-x-3">
              <img
                src={
                  otherUser.avatar_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.display_name)}&background=random`
                }
                alt={otherUser.display_name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {otherUser.display_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(conversation.last_activity), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <p className="text-sm text-gray-500 truncate">
                  @{otherUser.username}
                </p>
                {!conversation.is_active && (
                  <p className="text-xs text-red-500 mt-1">
                    Conversation inactive (not mutual followers)
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
