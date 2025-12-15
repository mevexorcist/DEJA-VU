'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ConversationList from './ConversationList';
import MessageThread from './MessageThread';

export default function DirectMessages() {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<{
    id: string;
    otherUser: any;
  } | null>(null);

  const handleConversationSelect = (conversationId: string, otherUser: any) => {
    setSelectedConversation({ id: conversationId, otherUser });
  };

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Direct Messages</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please log in to view your messages
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Messages
          </h2>
        </div>
        <ConversationList
          onConversationSelect={handleConversationSelect}
          selectedConversationId={selectedConversation?.id}
        />
      </div>

      {/* Message Thread */}
      <div className="flex-1 bg-gray-50 dark:bg-gray-900">
        {selectedConversation ? (
          <MessageThread
            conversationId={selectedConversation.id}
            otherUser={selectedConversation.otherUser}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
