import { useEffect, useState } from "react";

import type { Alarm } from "@/api/types";

type InitiatingAlarmIndicatorProps = {
  alarm: Alarm;
};

export const InitiatingAlarmIndicator = ({
  alarm,
}: InitiatingAlarmIndicatorProps) => {
  const [timeRemaining, setTimeRemaining] = useState(10);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const createdAt = new Date(alarm.createdAt).getTime();
    const duration = 10000; // 10 seconds

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - createdAt;
      const remaining = Math.max(0, duration - elapsed);
      const progressPercent = Math.min(100, (elapsed / duration) * 100);

      setTimeRemaining(Math.ceil(remaining / 1000));
      setProgress(progressPercent);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [alarm.createdAt]);

  // Calculate circle properties for SVG
  const size = 80;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative">
      {/* Circular Progress Ring */}
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#374151"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#FBBF24"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-100"
        />
      </svg>

      {/* User Image in Center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={alarm.userImage || "https://ui-avatars.com/api/?name=User"}
          alt={alarm.userName}
          className="w-14 h-14 rounded-full object-cover border-2 border-gray-700"
        />
      </div>

      {/* Countdown Timer */}
      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full">
        {timeRemaining}s
      </div>
    </div>
  );
};
