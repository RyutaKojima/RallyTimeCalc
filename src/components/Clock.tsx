"use client";

import { useState, useEffect } from 'react';

const Clock = () => {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <p className="mt-2 text-center text-gray-600">
      Current UTC Time: <span className="font-mono font-bold text-orange-500">{currentTime ? currentTime.toUTCString().match(/(\d{2}:\d{2}:\d{2})/)?.[0] : "--:--:--"}</span>
    </p>
  );
};

export default Clock;
