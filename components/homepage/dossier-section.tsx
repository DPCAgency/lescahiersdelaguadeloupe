import Link from 'next/link';
import type { ChapterItem } from '@/types/editorial';
import { ArrowRight } from 'lucide-react';

interface DossierSectionProps {
  chapters: ChapterItem[];
}

export function DossierSection({ chapters }: DossierSectionProps) {
  return (
    <section className="border-t border-border">
      <div className="container-editorial py-14 lg:py-20">
        <div className="max-w-3xl">
          <p className="eyebrow">Le dossier</p>
          <h2 className="section-title mt-3 text-[30px] sm:text-[40px] lg:text-[52px]">
            Qui gouverne réellement Le Gosier ?
          </h2>
          <p className="mt-3 text-[16px] leading-relaxed text-text">
            Une enquête en 7 chapitres pour comprendre comment se construit la décision publique.
          </p>
        </div>

        <ol className="mt-10 flex flex-col">
          {chapters.map((chapter) => (
            <li key={chapter.index} className="border-t border-border">
              <Link
                href={chapter.href}
                className="group grid grid-cols-1 items-start gap-3 py-6 sm:grid-cols-12 sm:gap-6"
              >
                <span className="font-display text-[40px] font-bold leading-none text-primary sm:col-span-2 sm:text-[56px] lg:text-[72px]">
                  {chapter.index}
                </span>
                <div className="sm:col-span-8">
                  <h3 className="article-title text-[20px] leading-[1.1] group-hover:text-primary sm:text-[24px] lg:text-[28px]">
                    {chapter.title}
                  </h3>
                  <p className="mt-2 text-[14px] text-text">{chapter.description}</p>
                </div>
                <div className="flex items-end justify-end sm:col-span-2">
                  <ArrowRight className="h-5 w-5 text-muted transition-all group-hover:translate-x-1 group-hover:text-primary" />
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
