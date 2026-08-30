import { Fragment, type ReactNode } from 'react';

interface TipTapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  text?: string;
}

interface RichTextRendererProps {
  content: unknown;
  className?: string;
}

function renderMarks(text: string, marks?: TipTapNode['marks']): ReactNode {
  if (!marks || marks.length === 0) return text;
  let node: ReactNode = text;
  for (const mark of marks) {
    if (mark.type === 'bold') {
      node = <strong key={mark.type}>{node}</strong>;
    } else if (mark.type === 'italic') {
      node = <em key={mark.type}>{node}</em>;
    }
  }
  return node;
}

function renderNode(node: TipTapNode, key: number): ReactNode {
  if (node.type === 'text') {
    return <Fragment key={key}>{renderMarks(node.text ?? '', node.marks)}</Fragment>;
  }

  if (node.type === 'paragraph') {
    return <p key={key}>{node.content?.map((c, i) => renderNode(c, i))}</p>;
  }

  if (node.type === 'heading') {
    const level = (node.attrs?.level as number) ?? 2;
    const Tag = (level === 2 ? 'h2' : level === 3 ? 'h3' : 'h2') as 'h2' | 'h3';
    return <Tag key={key}>{node.content?.map((c, i) => renderNode(c, i))}</Tag>;
  }

  if (node.type === 'bulletList') {
    return <ul key={key}>{node.content?.map((c, i) => renderNode(c, i))}</ul>;
  }

  if (node.type === 'orderedList') {
    return <ol key={key}>{node.content?.map((c, i) => renderNode(c, i))}</ol>;
  }

  if (node.type === 'listItem') {
    return <li key={key}>{node.content?.map((c, i) => renderNode(c, i))}</li>;
  }

  if (node.type === 'blockquote') {
    return <blockquote key={key}>{node.content?.map((c, i) => renderNode(c, i))}</blockquote>;
  }

  if (node.type === 'hardBreak') {
    return <br key={key} />;
  }

  if (node.type === 'doc') {
    return <Fragment key={key}>{node.content?.map((c, i) => renderNode(c, i))}</Fragment>;
  }

  return null;
}

export function RichTextRenderer({ content, className = '' }: RichTextRendererProps) {
  if (!content) return null;

  // If content is a string, render as plain text
  if (typeof content === 'string') {
    return <div className={className}>{content}</div>;
  }

  // If content is TipTap JSON
  const node = content as TipTapNode;
  if (node.type === 'doc') {
    return <div className={className}>{renderNode(node, 0)}</div>;
  }

  // Fallback: treat as unknown object
  return null;
}
