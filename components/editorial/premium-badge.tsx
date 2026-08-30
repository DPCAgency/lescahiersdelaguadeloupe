import { Lock, Globe, Sparkles } from 'lucide-react';
import type { AccessType } from '@/types/editorial';

interface PremiumBadgeProps {
  accessType: AccessType;
  className?: string;
}

const META: Record<AccessType, { label: string; icon: typeof Lock; cls: string }> = {
  free: { label: 'Gratuit', icon: Globe, cls: 'border-border text-muted' },
  member: { label: 'Membre', icon: Lock, cls: 'border-primary text-primary' },
  subscriber: { label: 'Abonnés', icon: Lock, cls: 'border-primary text-primary' },
  purchase: { label: 'Achat à l\'unité', icon: Lock, cls: 'border-ink text-ink' },
  hybrid: { label: 'Premium', icon: Lock, cls: 'border-primary text-primary' },
};

export function PremiumBadge({ accessType, className }: PremiumBadgeProps) {
  if (accessType === 'free') return null;
  const meta = META[accessType];
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] ${meta.cls} ${className ?? ''}`}
    >
      <Icon className="h-2.5 w-2.5" strokeWidth={2} />
      {meta.label}
    </span>
  );
}

export function FreeBadge({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 border border-border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted ${className ?? ''}`}
    >
      <Globe className="h-2.5 w-2.5" strokeWidth={2} />
      Gratuit
    </span>
  );
}

export function SubscriptionBadge({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 border border-primary bg-primary-light px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-primary-dark ${className ?? ''}`}
    >
      <Sparkles className="h-2.5 w-2.5" strokeWidth={2} />
      Inclus abonnement
    </span>
  );
}
