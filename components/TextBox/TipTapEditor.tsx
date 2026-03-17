
import type { Editor } from '@tiptap/react';

export interface EditorFormattingState {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrikethrough: boolean;
  fontFamily: string;
  fontSize: number;
  color: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
}

export const getEditorFormattingState = (editor: Editor | null): EditorFormattingState => {
  if (!editor) {
    return {
      isBold: false,
      isItalic: false,
      isUnderline: false,
      isStrikethrough: false,
      fontFamily: 'Arial',
      fontSize: 12,
      color: '#000000',
      textAlign: 'left',
    };
  }

  return {
    isBold: editor.isActive('bold'),
    isItalic: editor.isActive('italic'),
    isUnderline: editor.isActive('underline'),
    isStrikethrough: editor.isActive('strike'),
    fontFamily: editor.getAttributes('textStyle').fontFamily || 'Arial',
    fontSize: parseInt(editor.getAttributes('textStyle').fontSize, 10) || 12,
    color: editor.getAttributes('textStyle').color || '#000000',
    textAlign: (editor.getAttributes('paragraph').textAlign as any) || 'left',
  };
};

export const toggleBold = (editor: Editor | null) => {
  editor?.chain().focus().toggleBold().run();
};

export const toggleItalic = (editor: Editor | null) => {
  editor?.chain().focus().toggleItalic().run();
};

export const toggleUnderline = (editor: Editor | null) => {
  // Assuming underline extension is installed
  (editor?.chain().focus() as any).toggleUnderline().run();
};

export const toggleStrikethrough = (editor: Editor | null) => {
  editor?.chain().focus().toggleStrike().run();
};

export const setFontFamily = (editor: Editor | null, fontFamily: string) => {
  editor?.chain().focus().setMark('textStyle', { fontFamily }).run();
};

export const setFontSize = (editor: Editor | null, fontSize: number) => {
  editor?.chain().focus().setMark('textStyle', { fontSize: `${fontSize}px` }).run();
};

export const setColor = (editor: Editor | null, color: string) => {
  editor?.chain().focus().setMark('textStyle', { color }).run();
};

export const setTextAlign = (editor: Editor | null, textAlign: 'left' | 'center' | 'right' | 'justify') => {
  editor?.chain().focus().setTextAlign(textAlign).run();
};
