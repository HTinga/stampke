
import React from 'react';
import { useEditor, EditorContent, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import { TipTapToolbar } from './TipTapToolbar';
import './TiptapEditor.css';

// Custom FontSize extension
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {}
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              }
            },
          },
        },
      },
    ]
  },
});

import { TextStyle as CustomTextStyle } from '../annotations/types';

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  isEditable?: boolean;
  textStyle?: CustomTextStyle;
  scale?: number;
}

export const TiptapEditor: React.FC<TiptapEditorProps> = ({ content, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontFamily,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      FontSize,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="tiptap-editor-container border border-[#30363d] rounded-xl overflow-hidden bg-[#161b22]">
      <TipTapToolbar editor={editor} />
      <div className="tiptap-content-area p-4 min-h-[150px] max-h-[400px] overflow-y-auto focus:outline-none prose prose-sm max-w-none">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default TiptapEditor;
