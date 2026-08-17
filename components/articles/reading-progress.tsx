'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface ReadingProgressBarProps {
  readingTime: number;
}

export function ReadingProgressBar({ readingTime }: ReadingProgressBarProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
      setProgress(pct);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="sticky top-[73px] z-30 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="container-editorial flex items-center gap-4 py-2">
        <div className="h-1 flex-1 overflow-hidden bg-border">
          <div
            className="h-full bg-primary transition-[width] duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          <Clock className="h-3 w-3" />
          {readingTime} min
        </span>
      </div>
    </div>
  );
}
