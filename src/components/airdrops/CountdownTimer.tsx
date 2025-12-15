'use client';

import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  endDate: string;
  className?: string;
  onExpired?: () => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  endDate,
  className = '',
  onExpired,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  });

  const calculateTimeRemaining = (endDate: string): TimeRemaining => {
    const total = new Date(endDate).getTime() - Date.now();

    if (total <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((total % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, total };
  };

  useEffect(() => {
    const updateTimer = () => {
      const remaining = calculateTimeRemaining(endDate);
      setTimeRemaining(remaining);

      if (remaining.total <= 0 && onExpired) {
        onExpired();
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [endDate, onExpired]);

  const formatTimeUnit = (value: number, unit: string) => {
    return (
      <div className="text-center">
        <div className="text-lg font-bold text-gray-900">
          {value.toString().padStart(2, '0')}
        </div>
        <div className="text-xs text-gray-500 uppercase">{unit}</div>
      </div>
    );
  };

  if (timeRemaining.total <= 0) {
    return (
      <div className={`text-center py-2 ${className}`}>
        <span className="text-red-600 font-semibold">Expired</span>
      </div>
    );
  }

  const getUrgencyColor = () => {
    const hoursRemaining = timeRemaining.days * 24 + timeRemaining.hours;

    if (hoursRemaining <= 24) {
      return 'text-red-600 bg-red-50 border-red-200';
    } else if (hoursRemaining <= 72) {
      return 'text-orange-600 bg-orange-50 border-orange-200';
    } else {
      return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className={`${className}`}>
      <div
        className={`inline-flex items-center space-x-4 px-4 py-2 rounded-lg border ${getUrgencyColor()}`}
      >
        <div className="text-sm font-medium">Time Remaining:</div>

        <div className="flex items-center space-x-3">
          {timeRemaining.days > 0 && formatTimeUnit(timeRemaining.days, 'days')}
          {formatTimeUnit(timeRemaining.hours, 'hrs')}
          {formatTimeUnit(timeRemaining.minutes, 'min')}
          {timeRemaining.days === 0 &&
            formatTimeUnit(timeRemaining.seconds, 'sec')}
        </div>
      </div>

      {/* Urgency Message */}
      {timeRemaining.days === 0 && timeRemaining.hours <= 24 && (
        <div className="mt-2 text-sm text-red-600 font-medium">
          ⚠️ Deadline approaching! Complete requirements soon.
        </div>
      )}
    </div>
  );
};

export default CountdownTimer;
