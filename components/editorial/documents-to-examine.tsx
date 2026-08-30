import { FileText, ArrowRight } from 'lucide-react';

interface DocumentsToExamineProps {
  documents: { label: string; type: string }[];
}

export function DocumentsToExamine({ documents }: DocumentsToExamineProps) {
  return (
    <section className="border-t border-border">
      <div className="container-editorial py-14 lg:py-20">
        <div className="max-w-3xl">
          <p className="eyebrow">Méthodologie</p>
          <h2 className="section-title mt-3 text-[30px] sm:text-[40px] lg:text-[52px]">
            Ce que les documents doivent dire
          </h2>
          <p className="mt-3 text-[16px] leading-relaxed text-text">
            Les documents que la rédaction recherche ou examine pour construire cette enquête.
            Aucune source inexistante n’a été créée.
          </p>
        </div>

        <ul className="mt-10 grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc, i) => (
            <li
              key={i}
              className="group flex items-center gap-4 bg-background p-5 transition-colors hover:bg-background-soft"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-ink text-ink transition-colors group-hover:border-primary group-hover:text-primary">
                <FileText className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <div className="flex-1">
                <p className="article-title text-[16px]">{doc.label}</p>
                <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-muted">{doc.type}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted transition-all group-hover:translate-x-1 group-hover:text-primary" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
