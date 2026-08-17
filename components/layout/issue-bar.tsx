interface IssueBarProps {
  number: string;
  date: string;
  tagline?: string;
}

export function IssueBar({ number, date, tagline }: IssueBarProps) {
  return (
    <div className="border-b border-border bg-background-soft">
      <div className="container-editorial flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <span className="font-display text-[14px] font-bold uppercase tracking-[0.04em] text-ink">
            {number}
          </span>
          <span className="h-3 w-px bg-border" aria-hidden />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
            {date}
          </span>
        </div>
        {tagline && (
          <p className="hidden text-[10px] font-semibold uppercase tracking-[0.24em] text-primary sm:block">
            {tagline}
          </p>
        )}
      </div>
    </div>
  );
}
