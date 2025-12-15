'use client';

import { useRealtimeConnection } from '@/hooks/useRealtime';

interface RealtimeStatusProps {
  className?: string;
  showConnectionCount?: boolean;
}

export default function RealtimeStatus({
  className = '',
  showConnectionCount = false,
}: RealtimeStatusProps) {
  const { activeConnections, disconnectAll } = useRealtimeConnection();

  if (activeConnections === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1 text-xs text-green-500">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>Live</span>
        {showConnectionCount && (
          <span className="text-gray-500">({activeConnections})</span>
        )}
      </div>

      {showConnectionCount && (
        <button
          onClick={disconnectAll}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
          title="Disconnect all real-time connections"
        >
          Disconnect
        </button>
      )}
    </div>
  );
}
