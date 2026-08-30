import Image from 'next/image';
import type { IssueSummary } from '@/types/editorial';

interface IssueCoverProps {
  issue: IssueSummary;
  priority?: boolean;
}

export function IssueCover({ issue, priority = false }: IssueCoverProps) {
  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden bg-background-soft">
      <Image
        src={issue.cover ?? 'https://images.pexels.com/photos/38129343/pexels-photo-38129343.jpeg?auto=compress&cs=tinysrgb&w=800'}
        alt={`Couverture ${issue.number} — ${issue.title}`}
        fill
        sizes="(max-width: 768px) 100vw, 40vw"
        className="object-cover"
        priority={priority}
      />
    </div>
  );
}
