import { Quote } from 'lucide-react';

interface EditorialQuoteProps {
  text: string;
  author?: string;
  role?: string;
  level?: 'fait' | 'temoignage' | 'analyse';
}

export function EditorialQuote({ text, author, role, level = 'temoignage' }: EditorialQuoteProps) {
  const accent =
    level === 'fait' ? 'border-ink' : level === 'analyse' ? 'border-muted' : 'border-primary';
  return (
    <blockquote className={`my-10 border-l-2 ${accent} pl-6 sm:pl-10`}>
      <Quote className="h-7 w-7 text-primary" strokeWidth={1} aria-hidden />
      <p className="mt-4 font-serif text-[22px] font-normal leading-[1.4] text-ink sm:text-[28px] lg:text-[32px]">
        {text}
      </p>
      {(author || role) && (
        <footer className="mt-5 text-[13px] text-muted">
          {author && <span className="font-semibold uppercase tracking-[0.14em] text-ink">{author}</span>}
          {author && role && <span> — </span>}
          {role && <span>{role}</span>}
        </footer>
      )}
    </blockquote>
  );
}
