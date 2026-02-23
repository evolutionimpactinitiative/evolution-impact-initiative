"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  targetDate: string;
  onComplete?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function CountdownTimer({ targetDate, onComplete }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();

      if (difference <= 0) {
        setIsComplete(true);
        onComplete?.();
        return null;
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  if (isComplete) {
    return (
      <div className="text-center py-4">
        <p className="text-lg font-heading font-bold text-brand-green">
          Registration is now open!
        </p>
        <p className="text-sm text-brand-dark/70 mt-1">
          Refresh the page to register.
        </p>
      </div>
    );
  }

  if (!timeLeft) {
    return (
      <div className="flex justify-center gap-4">
        {["Days", "Hours", "Minutes", "Seconds"].map((label) => (
          <div key={label} className="text-center">
            <div className="bg-white rounded-lg shadow-sm px-4 py-3 min-w-[70px]">
              <div className="text-2xl md:text-3xl font-heading font-black text-brand-dark">
                --
              </div>
            </div>
            <span className="text-xs text-brand-dark/60 mt-1 block">{label}</span>
          </div>
        ))}
      </div>
    );
  }

  const timeUnits = [
    { value: timeLeft.days, label: "Days" },
    { value: timeLeft.hours, label: "Hours" },
    { value: timeLeft.minutes, label: "Minutes" },
    { value: timeLeft.seconds, label: "Seconds" },
  ];

  return (
    <div className="flex justify-center gap-2 md:gap-4">
      {timeUnits.map(({ value, label }) => (
        <div key={label} className="text-center">
          <div className="bg-white rounded-lg shadow-sm px-3 md:px-4 py-3 min-w-[60px] md:min-w-[70px]">
            <div className="text-xl md:text-3xl font-heading font-black text-brand-dark tabular-nums">
              {value.toString().padStart(2, "0")}
            </div>
          </div>
          <span className="text-[10px] md:text-xs text-brand-dark/60 mt-1 block">{label}</span>
        </div>
      ))}
    </div>
  );
}
