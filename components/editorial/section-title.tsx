import { cn } from '@/lib/utils';

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionTitle({ eyebrow, title, align = 'left', className }: SectionTitleProps) {
  return (
    <div className={cn(align === 'center' && 'text-center', className)}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h2 className="section-title text-[28px] sm:text-[34px] lg:text-[42px]">{title}</h2>
    </div>
  );
}
