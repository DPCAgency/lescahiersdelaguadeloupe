'use client';

import { useEffect, useRef, useState } from 'react';
import type { KeyFigure } from '@/types/editorial';

interface KeyFiguresProps {
  figures: KeyFigure[];
}

export function KeyFigures({ figures }: KeyFiguresProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="grid grid-cols-2 gap-px border border-border bg-border lg:grid-cols-4"
    >
      {figures.map((fig, i) => (
        <div
          key={i}
          className={`bg-background px-5 py-8 text-center sm:px-8 sm:py-10 ${
            visible ? 'animate-count-up' : 'opacity-0'
          }`}
          style={{ animationDelay: `${i * 120}ms` }}
        >
          <p className="font-display text-[40px] font-bold leading-none text-ink sm:text-[56px] lg:text-[64px]">
            {fig.value}
          </p>
          <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-muted">
            {fig.label}
          </p>
        </div>
      ))}
    </div>
  );
}
