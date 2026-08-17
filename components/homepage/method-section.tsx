import { Search, FileText, Lightbulb, MessageSquare } from 'lucide-react';

interface MethodSectionProps {
  title: string;
  steps: { label: string; description: string }[];
}

const ICONS = [Search, FileText, Lightbulb, MessageSquare];

export function MethodSection({ title, steps }: MethodSectionProps) {
  return (
    <section className="border-t border-border">
      <div className="container-editorial py-14 lg:py-20">
        <div className="max-w-3xl">
          <p className="eyebrow">Méthode rédactionnelle</p>
          <h2 className="section-title mt-2 text-[28px] sm:text-[36px] lg:text-[44px]">
            {title}
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => {
            const Icon = ICONS[i] ?? Search;
            return (
              <div key={step.label} className="flex flex-col bg-background p-6 sm:p-8">
                <span className="flex h-12 w-12 items-center justify-center border border-ink text-ink">
                  <Icon className="h-6 w-6" strokeWidth={1.5} />
                </span>
                <h3 className="mt-5 font-display text-[20px] font-bold uppercase leading-[1.1] text-ink">
                  {step.label}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-text">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
