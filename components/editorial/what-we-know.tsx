import { Check, HelpCircle } from 'lucide-react';

interface WhatWeKnowProps {
  known: string[];
  unknown: string[];
}

export function WhatWeKnow({ known, unknown }: WhatWeKnowProps) {
  return (
    <div className="grid grid-cols-1 gap-px border border-border bg-border lg:grid-cols-2">
      <div className="bg-background p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-primary" strokeWidth={2} />
          <h3 className="eyebrow-ink">Ce que nous avons établi</h3>
        </div>
        <ul className="mt-5 flex flex-col gap-4">
          {known.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-[15px] leading-relaxed text-text">
              <span className="mt-2 h-1 w-1 shrink-0 bg-primary" />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-background-soft p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-muted" strokeWidth={1.5} />
          <h3 className="eyebrow-muted">Ce que nous ne savons pas encore</h3>
        </div>
        <ul className="mt-5 flex flex-col gap-4">
          {unknown.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-[15px] leading-relaxed text-text">
              <span className="mt-2 h-1 w-1 shrink-0 bg-muted" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
