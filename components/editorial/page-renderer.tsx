import { RichTextRenderer } from './rich-text-renderer';

export type PageLayout = '1-column' | '2-columns' | 'hero-image' | 'image-text';

export interface PageBlockData {
  id: string;
  block_type: string;
  position: number;
  content_json: {
    text?: string;
    richContent?: unknown;
    imageUrl?: string;
    caption?: string;
    credit?: string;
    alt?: string;
    alignment?: 'left' | 'center' | 'right';
    fontSize?: 'sm' | 'base' | 'lg' | 'xl';
    figure?: string;
    source?: string;
    imageWidth?: 'normal' | 'wide' | 'full';
    spaceBefore?: 'none' | 'sm' | 'md' | 'lg';
    spaceAfter?: 'none' | 'sm' | 'md' | 'lg';
    columnSpan?: 1 | 2;
    imageSide?: 'left' | 'right';
    pageLayout?: PageLayout;
  };
}

const SPACE_CLASSES: Record<string, string> = {
  none: 'my-0', sm: 'my-2', md: 'my-4', lg: 'my-8',
};

const FONT_CLASSES: Record<string, string> = {
  sm: 'text-sm', base: 'text-base', lg: 'text-lg', xl: 'text-xl',
};

const ALIGN_CLASSES: Record<string, string> = {
  left: 'text-left', center: 'text-center', right: 'text-right',
};

function BlockView({ block }: { block: PageBlockData }) {
  const c = block.content_json;
  const align = ALIGN_CLASSES[c.alignment ?? 'left'];
  const font = FONT_CLASSES[c.fontSize ?? 'base'];
  const spaceBefore = SPACE_CLASSES[c.spaceBefore ?? 'md'];
  const spaceAfter = SPACE_CLASSES[c.spaceAfter ?? 'md'];

  if (block.block_type === 'heading') {
    return <h1 className={`font-display text-3xl font-bold text-neutral-800 ${align} ${spaceBefore} ${spaceAfter}`}>{c.text}</h1>;
  }
  if (block.block_type === 'subheading') {
    return <h2 className={`font-display text-xl font-semibold text-neutral-600 ${align} ${spaceBefore} ${spaceAfter}`}>{c.text}</h2>;
  }
  if (block.block_type === 'paragraph') {
    return <RichTextRenderer content={c.richContent ?? c.text} className={`leading-relaxed text-neutral-700 ${align} ${font} ${spaceBefore} ${spaceAfter}`} />;
  }
  if (block.block_type === 'image' && c.imageUrl) {
    return (
      <div className={`${align} ${spaceBefore} ${spaceAfter}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={c.imageUrl} alt={c.alt ?? ''} className="max-w-full rounded-lg" />
        {c.caption && <p className="mt-2 text-xs text-neutral-400">{c.caption}</p>}
        {c.credit && <p className="text-[10px] text-neutral-300">© {c.credit}</p>}
      </div>
    );
  }
  if (block.block_type === 'quote') {
    return (
      <blockquote className={`border-l-4 border-ink pl-4 ${align} ${spaceBefore} ${spaceAfter}`}>
        <p className="font-display text-lg italic text-neutral-700">{c.text}</p>
        {c.source && <cite className="mt-1 block text-xs text-neutral-400">· {c.source}</cite>}
      </blockquote>
    );
  }
  if (block.block_type === 'key_figure') {
    return (
      <div className={`rounded-lg bg-neutral-50 p-4 ${align} ${spaceBefore} ${spaceAfter}`}>
        <p className="font-display text-4xl font-bold text-ink">{c.figure}</p>
        {c.text && <p className="mt-1 text-xs text-neutral-500">{c.text}</p>}
      </div>
    );
  }
  if (block.block_type === 'separator') {
    return <hr className={`border-neutral-200 ${spaceBefore} ${spaceAfter}`} />;
  }
  if (block.block_type === 'sidebar') {
    return (
      <div className={`rounded-lg border border-neutral-200 bg-neutral-50 p-4 ${spaceBefore} ${spaceAfter}`}>
        <p className="text-sm font-medium text-neutral-700">{c.text}</p>
      </div>
    );
  }
  return null;
}

export function PageRenderer({ blocks, layout }: { blocks: PageBlockData[]; layout: PageLayout }) {
  if (layout === 'image-text') {
    const imageBlock = blocks.find((b) => b.block_type === 'image');
    const textBlocks = blocks.filter((b) => b.block_type !== 'image');
    const imageSide = imageBlock?.content_json.imageSide ?? 'left';
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {imageSide === 'left' && imageBlock && <div><BlockView block={imageBlock} /></div>}
        <div>{textBlocks.map((b) => <BlockView key={b.id} block={b} />)}</div>
        {imageSide === 'right' && imageBlock && <div><BlockView block={imageBlock} /></div>}
      </div>
    );
  }

  if (layout === '2-columns') {
    return (
      <div className="grid grid-cols-2 gap-8">
        {blocks.map((block) => {
          const colSpan = block.content_json.columnSpan ?? (block.content_json.imageWidth === 'wide' || block.content_json.imageWidth === 'full' ? 2 : 1);
          return <div key={block.id} className={colSpan === 2 ? 'col-span-2' : 'col-span-1'}><BlockView block={block} /></div>;
        })}
      </div>
    );
  }

  return <div>{blocks.map((b) => <BlockView key={b.id} block={b} />)}</div>;
}
