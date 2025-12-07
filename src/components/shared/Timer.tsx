import { useState, useEffect, useRef } from 'react';
import { playTick, playUrgentTick, playTimeUp } from '../../utils/sounds';

interface TimerProps {
  startTime: number; // timestamp when question started
  duration: number; // seconds
  onTimeUp?: () => void;
  size?: 'small' | 'large';
  enableSound?: boolean;
}

export function Timer({ startTime, duration, onTimeUp, size = 'large', enableSound = true }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const lastTickRef = useRef<number>(duration + 1);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, duration - elapsed);
      return Math.ceil(remaining);
    };

    setTimeLeft(calculateTimeLeft());
    lastTickRef.current = duration + 1;

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      // Play tick sounds for last 5 seconds (only once per second)
      if (enableSound && remaining <= 5 && remaining > 0 && remaining < lastTickRef.current) {
        lastTickRef.current = remaining;
        if (remaining <= 3) {
          playUrgentTick();
        } else {
          playTick();
        }
      }

      if (remaining <= 0) {
        clearInterval(interval);
        if (enableSound) playTimeUp();
        onTimeUp?.();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [startTime, duration, onTimeUp, enableSound]);

  const percentage = (timeLeft / duration) * 100;
  const isLow = timeLeft <= 5;
  const isCritical = timeLeft <= 3;

  const sizeClasses = size === 'large'
    ? 'w-32 h-32 text-4xl'
    : 'w-16 h-16 text-xl';

  const colorClasses = isCritical
    ? 'text-red-500 border-red-500'
    : isLow
    ? 'text-orange-500 border-orange-500'
    : 'text-white border-white';

  return (
    <div className={`relative ${sizeClasses} ${colorClasses}`}>
      {/* Background circle */}
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          opacity="0.2"
        />
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray={`${percentage * 2.83} 283`}
          strokeLinecap="round"
          className="transition-all duration-100"
        />
      </svg>
      {/* Time text */}
      <div className="absolute inset-0 flex items-center justify-center font-bold">
        {timeLeft}
      </div>
    </div>
  );
}
