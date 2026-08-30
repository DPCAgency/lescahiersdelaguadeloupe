'use client';

import { useState } from 'react';
import type { TimelineEvent } from '@/types/editorial';
import { ChevronDown, FileText, MessageSquare, Scale, CircleDot } from 'lucide-react';

const TYPE_META: Record<
  TimelineEvent['type'],
  { label: string; icon: typeof FileText; color: string }
> = {
  fait: { label: 'Fait', icon: CircleDot, color: 'text-ink' },
  document: { label: 'Document', icon: FileText, color: 'text-primary' },
  temoignage: { label: 'Témoignage', icon: MessageSquare, color: 'text-[#8a6d3b]' },
  decision: { label: 'Décision', icon: Scale, color: 'text-primary-dark' },
};

interface TimelineProps {
  events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="flex flex-col">
      {events.map((event, i) => {
        const meta = TYPE_META[event.type];
        const Icon = meta.icon;
        const isOpen = openIndex === i;
        return (
          <div key={i} className="border-l-2 border-border pl-6 sm:pl-10">
            <div className="relative">
              <span className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-ink sm:-left-[43px] sm:h-6 sm:w-6">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              </span>
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full py-5 text-left"
                aria-expanded={isOpen}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-display text-[15px] font-semibold text-primary">
                        {event.date}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${meta.color}`}>
                        <Icon className="h-3 w-3" />
                        {meta.label}
                      </span>
                    </div>
                    <h3 className="mt-1.5 article-title text-[18px] leading-[1.2] sm:text-[22px]">
                      {event.title}
                    </h3>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </div>
                {isOpen && (
                  <div className="mt-3 animate-fade-in">
                    <p className="text-[15px] leading-relaxed text-text">{event.description}</p>
                    {event.people && (
                      <p className="mt-2 text-[12px] text-muted">
                        <span className="font-semibold uppercase tracking-[0.14em]">Personnes concernées · </span>
                        {event.people}
                      </p>
                    )}
                    {event.source && (
                      <p className="mt-1 text-[12px] text-muted">
                        <span className="font-semibold uppercase tracking-[0.14em]">Source · </span>
                        {event.source}
                      </p>
                    )}
                  </div>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
