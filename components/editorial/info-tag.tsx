import type { InfoLevel } from '@/types/editorial';
import {
  CircleDot,
  FileText,
  MessageSquare,
  GitCompare,
  BarChart3,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';

export const LEVEL_META: Record<
  InfoLevel,
  { label: string; tagClass: string; icon: typeof CircleDot; description: string }
> = {
  fait: {
    label: 'Fait établi',
    tagClass: 'tag-fact',
    icon: CircleDot,
    description: 'Information documentée et vérifiée.',
  },
  document: {
    label: 'Document',
    tagClass: 'tag-document',
    icon: FileText,
    description: 'Source documentaire officielle.',
  },
  temoignage: {
    label: 'Témoignage',
    tagClass: 'tag-testimony',
    icon: MessageSquare,
    description: 'Information provenant d’un témoignage.',
  },
  rapprochement: {
    label: 'Rapprochement',
    tagClass: 'tag-analysis',
    icon: GitCompare,
    description: 'Mise en relation de plusieurs éléments.',
  },
  analyse: {
    label: 'Analyse',
    tagClass: 'tag-analysis',
    icon: BarChart3,
    description: 'Analyse de la rédaction.',
  },
  question: {
    label: 'Question ouverte',
    tagClass: 'tag-question',
    icon: HelpCircle,
    description: 'Question restant sans réponse définitive.',
  },
  hypothese: {
    label: 'Hypothèse',
    tagClass: 'tag-hypothesis',
    icon: Lightbulb,
    description: 'Hypothèse — jamais présentée comme un fait.',
  },
};

interface InfoTagProps {
  level: InfoLevel;
  className?: string;
}

export function InfoTag({ level, className }: InfoTagProps) {
  const meta = LEVEL_META[level];
  const Icon = meta.icon;
  return (
    <span className={`${meta.tagClass} ${className ?? ''}`}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}
