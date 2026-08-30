import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, FileText } from 'lucide-react';
import { HERO_IMAGE, ISSUE_NUMBER, ISSUE_DATE, HERO_QUOTE } from '@/lib/demo-data';

export function HomeHero() {
  return (
    <section className="border-b border-ink">
      <div className="container-wide">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Texte */}
          <div className="flex flex-col justify-between border-b border-border py-10 lg:col-span-7 lg:border-b-0 lg:border-r lg:py-16 lg:pr-16">
            <div>
              <div className="flex items-center gap-3">
                <span className="eyebrow">Enquête · N°2</span>
                <span className="h-px w-8 bg-primary" aria-hidden />
                <span className="eyebrow-muted">{ISSUE_DATE}</span>
              </div>
              <h1 className="display-title mt-6 text-[44px] sm:text-[64px] lg:text-[80px] xl:text-[96px]">
                Qui gouverne
                <br />
                réellement
                <br />
                <span className="text-primary">Le Gosier ?</span>
              </h1>
              <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-text">
                {HERO_QUOTE}
              </p>
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/enquetes/qui-gouverne-reellement-le-gosier" className="btn-editorial">
                Lire l’enquête
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/les-cahiers/numero-02" className="btn-editorial-outline">
                <FileText className="h-4 w-4" />
                Voir le cahier N°2
              </Link>
            </div>
          </div>

          {/* Image */}
          <div className="relative min-h-[320px] bg-background-soft lg:col-span-5 lg:min-h-[600px]">
            <Image
              src={HERO_IMAGE}
              alt="Côte de la Guadeloupe au coucher du soleil"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between text-white">
              <span className="text-[10px] font-semibold uppercase tracking-[0.24em]">
                {ISSUE_NUMBER} · {ISSUE_DATE}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.24em]">
                Comprendre aujourd’hui pour agir demain
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
