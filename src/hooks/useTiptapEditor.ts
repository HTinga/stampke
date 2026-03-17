
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export const useTiptapEditor = () => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
  });

  return editor;
};
