import { RichTextRenderer } from './rich-text-renderer';

export interface ArticleBlockData {
  id?: string;
  type: string;
  position: number;
  content_json: Record<string, unknown> | null;
}

export interface ArticleRenderData {
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  hero_image_path?: string | null;
  hero_caption?: string | null;
  hero_credit?: string | null;
  author_name?: string | null;
  category_name?: string | null;
  published_at?: string | null;
  reading_time_minutes?: number | null;
  blocks: ArticleBlockData[];
}

export function ArticleRenderer({ article }: { article: ArticleRenderData }) {
  const pubDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <article className="mx-auto max-w-2xl">
      {article.category_name && (
        <span className="text-xs font-semibold uppercase tracking-wider text-ink">{article.category_name}</span>
      )}
      <h1 className="mt-2 font-display text-3xl font-bold text-neutral-800">{article.title}</h1>
      {article.subtitle && <p className="mt-2 text-lg text-neutral-500">{article.subtitle}</p>}
      {article.excerpt && <p className="mt-4 text-base italic text-neutral-600">{article.excerpt}</p>}

      <div className="mt-4 flex items-center gap-3 text-xs text-neutral-400">
        {article.author_name && <span>Par {article.author_name}</span>}
        {pubDate && <span>· {pubDate}</span>}
        {article.reading_time_minutes ? <span>· {article.reading_time_minutes} min de lecture</span> : null}
      </div>

      {article.hero_image_path && (
        <figure className="mt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.hero_image_path} alt={article.hero_caption ?? ''} className="w-full rounded-lg" />
          {(article.hero_caption || article.hero_credit) && (
            <figcaption className="mt-2 text-xs text-neutral-400">
              {article.hero_caption}
              {article.hero_credit ? ` — © ${article.hero_credit}` : ''}
            </figcaption>
          )}
        </figure>
      )}

      <div className="mt-8 space-y-4">
        {article.blocks.map((block, i) => (
          <ArticleBlockRenderer key={block.id ?? i} block={block} />
        ))}
      </div>
    </article>
  );
}

function ArticleBlockRenderer({ block }: { block: ArticleBlockData }) {
  const content = block.content_json ?? {};
  const type = block.type;

  if (type === 'paragraph') {
    return <RichTextRenderer content={content.richContent ?? content.text} className="text-neutral-700" />;
  }

  if (type === 'analysis' || type === 'fact' || type === 'testimony' || type === 'hypothesis' || type === 'open_question' || type === 'sidebar' || type === 'source') {
    return <p className="text-neutral-700">{(content.text as string) || ''}</p>;
  }

  if (type === 'heading') {
    const level = (content.level as number) ?? 2;
    const Tag = (level === 2 ? 'h2' : level === 3 ? 'h3' : 'h2') as 'h2' | 'h3';
    return <Tag className="font-display font-bold text-neutral-800">{(content.heading as string) || ''}</Tag>;
  }

  if (type === 'quote') {
    return (
      <blockquote className="border-l-4 border-ink pl-4 text-lg italic text-neutral-700">
        « {(content.quote as string) || ''} »
        {content.author ? <footer className="mt-2 text-sm not-italic text-neutral-500">— {content.author as string}</footer> : null}
      </blockquote>
    );
  }

  if (type === 'image') {
    return (
      <figure>
        {content.image_path ? <img src={content.image_path as string} alt={(content.alt as string) ?? ''} className="rounded-lg" /> : null}
        {content.caption ? <figcaption className="mt-1 text-xs text-neutral-400">{content.caption as string}</figcaption> : null}
      </figure>
    );
  }

  if (type === 'key_figures') {
    const figures = (content.figures as { value: string; label: string }[]) ?? [];
    return (
      <div className="grid grid-cols-2 gap-4">
        {figures.map((f, i) => (
          <div key={i} className="rounded border border-neutral-200 p-4 text-center">
            <p className="font-display text-2xl font-bold text-ink">{f.value}</p>
            <p className="text-xs text-neutral-500">{f.label}</p>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'timeline') {
    const events = (content.events as { date: string; title: string; description: string }[]) ?? [];
    return (
      <ol className="space-y-3">
        {events.map((ev, i) => (
          <li key={i} className="flex gap-3">
            <span className="font-display font-bold text-ink">{ev.date}</span>
            <div>
              <p className="font-medium text-neutral-700">{ev.title}</p>
              <p className="text-sm text-neutral-500">{ev.description}</p>
            </div>
          </li>
        ))}
      </ol>
    );
  }

  if (type === 'video') {
    return (
      <div className="aspect-video rounded-lg bg-neutral-100">
        {content.url ? <iframe src={content.url as string} className="h-full w-full rounded-lg" title="Vidéo" allowFullScreen /> : null}
      </div>
    );
  }

  if (type === 'gallery') {
    const images = (content.images as string[]) ?? [];
    return (
      <div className="grid grid-cols-2 gap-2">
        {images.map((src, i) => (
          <img key={i} src={src} alt="" className="rounded-lg" />
        ))}
      </div>
    );
  }

  if (type === 'document') {
    return (
      <a href={(content.file_path as string) ?? '#'} className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-4 py-2 text-sm text-ink hover:bg-neutral-50">
        {(content.title as string) || 'Document'}
      </a>
    );
  }

  if (type === 'issue_reference') {
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
        Référence : Cahier N°{String(content.issue_number ?? '')}{content.pages ? `, pages ${content.pages as string}` : ''}
      </div>
    );
  }

  return null;
}
