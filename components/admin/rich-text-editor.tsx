'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

interface RichTextEditorProps {
  content: unknown;
  onChange: (json: unknown) => void;
  editable?: boolean;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ content, onChange, editable = true, placeholder, className = '' }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content || { type: 'doc', content: [{ type: 'paragraph' }] },
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none ${className}`,
        'data-placeholder': placeholder ?? '',
      },
    },
  });

  useEffect(() => {
    if (editor && editable !== editor.isEditable) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  if (!editor) return null;

  return (
    <div className="rich-text-editor">
      {editable && (
        <div className="mb-1 flex gap-0.5 border-b border-neutral-100 pb-1">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`rounded px-2 py-1 text-xs ${editor.isActive('bold') ? 'bg-ink text-white' : 'text-neutral-500 hover:bg-neutral-100'}`}
          >
            B
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`rounded px-2 py-1 text-xs italic ${editor.isActive('italic') ? 'bg-ink text-white' : 'text-neutral-500 hover:bg-neutral-100'}`}
          >
            I
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`rounded px-2 py-1 text-xs ${editor.isActive('heading', { level: 2 }) ? 'bg-ink text-white' : 'text-neutral-500 hover:bg-neutral-100'}`}
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`rounded px-2 py-1 text-xs ${editor.isActive('heading', { level: 3 }) ? 'bg-ink text-white' : 'text-neutral-500 hover:bg-neutral-100'}`}
          >
            H3
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`rounded px-2 py-1 text-xs ${editor.isActive('bulletList') ? 'bg-ink text-white' : 'text-neutral-500 hover:bg-neutral-100'}`}
          >
            •
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`rounded px-2 py-1 text-xs ${editor.isActive('blockquote') ? 'bg-ink text-white' : 'text-neutral-500 hover:bg-neutral-100'}`}
          >
            ❝
          </button>
          <button
            onClick={() => editor.chain().focus().undo().run()}
            className="rounded px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100"
          >
            ↶
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            className="rounded px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100"
          >
            ↷
          </button>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
