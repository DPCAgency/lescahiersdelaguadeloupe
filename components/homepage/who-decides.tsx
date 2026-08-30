import type { ActorNode } from '@/types/editorial';
import {
  Landmark,
  Users,
  Building2,
  Briefcase,
  TrendingUp,
  Network,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  Landmark,
  Users,
  Building2,
  Briefcase,
  TrendingUp,
  Network,
};

interface WhoDecidesProps {
  actors: ActorNode[];
  intro: string;
}

export function WhoDecides({ actors, intro }: WhoDecidesProps) {
  return (
    <section className="border-t border-border">
      <div className="container-editorial py-14 lg:py-20">
        <div className="max-w-3xl">
          <p className="eyebrow">La question</p>
          <h2 className="section-title mt-3 text-[34px] sm:text-[44px] lg:text-[56px]">
            Qui décide ?
          </h2>
          <p className="mt-4 text-[17px] leading-relaxed text-text">
            {intro}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {actors.map((actor) => {
            const Icon = ICONS[actor.icon] ?? Landmark;
            return (
              <a
                key={actor.id}
                href={`/enquetes/qui-gouverne-reellement-le-gosier#${actor.id}`}
                className="group flex flex-col bg-background p-6 transition-colors hover:bg-background-soft sm:p-8"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-12 w-12 items-center justify-center border border-ink text-ink transition-colors group-hover:border-primary group-hover:text-primary">
                    <Icon className="h-6 w-6" strokeWidth={1.5} />
                  </span>
                  <ArrowRight className="h-5 w-5 text-muted transition-all group-hover:translate-x-1 group-hover:text-primary" />
                </div>
                <h3 className="mt-5 article-title text-[20px] leading-[1.1]">{actor.label}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-text">{actor.description}</p>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
