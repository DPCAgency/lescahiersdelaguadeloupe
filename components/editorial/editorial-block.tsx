import { cn } from '@/lib/utils';
import type { InfoLevel } from '@/types/editorial';
import { InfoTag, LEVEL_META } from './info-tag';

interface EditorialBlockProps {
  level: InfoLevel;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function EditorialBlock({ level, title, children, className }: EditorialBlockProps) {
  const meta = LEVEL_META[level];
  return (
    <aside
      className={cn(
        'border border-border bg-background-soft p-6 sm:p-8',
        level === 'fait' && 'border-l-4 border-l-ink',
        level === 'document' && 'border-l-4 border-l-primary',
        level === 'temoignage' && 'border-l-4 border-l-[#8a6d3b]',
        level === 'question' && 'border-l-4 border-l-primary',
        level === 'hypothese' && 'border-l-4 border-l-dashed border-l-muted',
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <InfoTag level={level} />
        <span className="text-[11px] text-muted">{meta.description}</span>
      </div>
      {title && <h4 className="article-title mb-2 text-[18px]">{title}</h4>}
      <div className="text-[15px] leading-relaxed text-text">{children}</div>
    </aside>
  );
}
