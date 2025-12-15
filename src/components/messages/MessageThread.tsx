'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MessageService } from '@/lib/database';
import { useRealtimeDirectMessages } from '@/hooks/useRealtime';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  media_urls: string[] | null;
  is_read: boolean;
  sent_at: string;
  read_at: string | null;
  sender: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

interface MessageThreadProps {
  conversationId: string;
  otherUser: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export default function MessageThread({
  conversationId,
  otherUser,
}: MessageThreadProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingIndicator, setTypingIndicator] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Real-time direct messages
  const { isConnected } = useRealtimeDirectMessages(
    conversationId,
    (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
      // Auto-mark as read if it's from the other user
      if (newMessage.sender_id !== user?.id) {
        MessageService.markMessageAsRead(newMessage.id);
      }
    },
    (messageId) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      );
    }
  );

  useEffect(() => {
    if (conversationId) {
      loadMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const conversationMessages =
        await MessageService.getConversationMessages(conversationId);
      setMessages(conversationMessages);

      // Mark unread messages as read
      const unreadMessages = conversationMessages.filter(
        (msg) => !msg.is_read && msg.sender_id !== user?.id
      );

      for (const message of unreadMessages) {
        await MessageService.markMessageAsRead(message.id);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim() || sending) return;

    setSending(true);
    try {
      const messageData = {
        conversation_id: conversationId,
        sender_id: user.id,
        content: newMessage.trim(),
        media_urls: null,
      };

      const sentMessage = await MessageService.sendMessage(messageData);
      setMessages((prev) => [...prev, sentMessage]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={
                otherUser.avatar_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.display_name)}&background=random`
              }
              alt={otherUser.display_name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {otherUser.display_name}
              </h3>
              <p className="text-sm text-gray-500">@{otherUser.username}</p>
            </div>
          </div>
          {isConnected && (
            <div className="flex items-center gap-1 text-xs text-green-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Live
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet</p>
            <p className="text-sm mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender_id === user?.id;

            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}
                >
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      isOwnMessage
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <p
                    className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}
                  >
                    {formatDistanceToNow(new Date(message.sent_at), {
                      addSuffix: true,
                    })}
                    {isOwnMessage && message.is_read && (
                      <span className="ml-1">✓</span>
                    )}
                  </p>
                </div>

                {!isOwnMessage && (
                  <img
                    src={
                      message.sender.avatar_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender.display_name)}&background=random`
                    }
                    alt={message.sender.display_name}
                    className="w-8 h-8 rounded-full object-cover order-1 mr-2"
                  />
                )}
              </div>
            );
          })
        )}

        {/* Typing Indicator */}
        {typingIndicator && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md">
              <div className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {otherUser.display_name} is typing...
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
