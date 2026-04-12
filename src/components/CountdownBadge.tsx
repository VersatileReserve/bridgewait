'use client';

import { useEffect, useState } from 'react';
import { formatCountdown } from '@/lib/countdown';

interface CountdownBadgeProps {
  target: Date;
}

export default function CountdownBadge({ target }: CountdownBadgeProps) {
  const [text, setText] = useState(formatCountdown(target));

  useEffect(() => {
    const interval = setInterval(() => {
      setText(formatCountdown(target));
    }, 1000);
    return () => clearInterval(interval);
  }, [target]);

  const diff = (target.getTime() - Date.now()) / 60000;
  let color = 'text-green-600';
  if (diff <= 5) color = 'text-red-600';
  else if (diff <= 30) color = 'text-amber-600';

  return <span className={`font-semibold ${color}`}>{text}</span>;
}
