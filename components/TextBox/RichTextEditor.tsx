import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { FreeTextAnnotation, TextStyle, BoxStyle } from '../../src/annotations/types';
import { DEFAULT_TEXT_STYLE, DEFAULT_BOX_STYLE } from '../../src/annotations/types';
import { useAnnotationStore } from '../../src/store';
import { useAnnotationHistoryStore } from '../../src/store';
import { TextBoxContextMenu } from './TextBoxContextMenu';
import { BoxPropertiesPanel } from './BoxPropertiesPanel';
import { TextPropertiesPanel } from './TextPropertiesPanel';
import { TiptapEditor as TipTapEditor } from '../TiptapEditor';
import './RichTextEditor.css';

interface RichTextEditorProps {
  annotation: FreeTextAnnotation;
  scale: number;
  isSelected: boolean;
  onSelect: () => void;
  onDeselect: () => void;
}

export function RichTextEditor({
  annotation,
  scale,
  isSelected,
  onSelect,
  onDeselect,
}: RichTextEditorProps) {
  const { updateAnnotation, removeAnnotation } = useAnnotationStore();
  const { recordUpdate, recordDelete } = useAnnotationHistoryStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showBoxProperties, setShowBoxProperties] = useState(false);
  const [showTextProperties, setShowTextProperties] = useState(false);

  const [x, y, width, height] = annotation.rect;
  const textStyle: TextStyle = annotation.textStyle || DEFAULT_TEXT_STYLE;
  const boxStyle: BoxStyle = annotation.boxStyle || DEFAULT_BOX_STYLE;
  const rotation = annotation.rotation || 0;

  // Handle click outside to deselect
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        !contextMenu &&
        !showBoxProperties &&
        !showTextProperties
      ) {
        if (isEditing) {
          setIsEditing(false);
        }
        if (isSelected) {
          onDeselect();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSelected, isEditing, contextMenu, showBoxProperties, showTextProperties, onDeselect]);

  // Double click to edit
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    onSelect();
  }, [onSelect]);

  // Context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
    onSelect();
  }, [onSelect]);

  // Update content with undo support
  const handleContentChange = useCallback(
    (newContent: string) => {
      const previousState = { ...annotation };
      updateAnnotation(annotation.id, { content: newContent });
      recordUpdate({ ...annotation, content: newContent } as any, previousState as any);
    },
    [annotation, updateAnnotation, recordUpdate]
  );

  // Context menu actions
  const handleDelete = useCallback(() => {
    const previousState = { ...annotation };
    removeAnnotation(annotation.id);
    recordDelete(previousState as any);
  }, [annotation, removeAnnotation, recordDelete]);

  const handleDuplicate = useCallback(() => {
    // Implement duplicate logic
    console.log('Duplicate not implemented yet');
  }, []);

  const handleBringToFront = useCallback(() => {
    // Implement z-index logic
    console.log('Bring to front not implemented yet');
  }, []);

  const handleSendToBack = useCallback(() => {
    // Implement z-index logic
    console.log('Send to back not implemented yet');
  }, []);

  // Calculate scaled styles
  const scaledRect = {
    left: x * scale,
    top: y * scale,
    width: width * scale,
    height: height * scale,
  };

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    ...scaledRect,
    transform: `rotate(${rotation}deg)`,
    transformOrigin: 'center center',
    cursor: isEditing ? 'text' : 'move',
    zIndex: isSelected ? 100 : 10,
    outline: isSelected && !isEditing ? '2px solid #0066FF' : 'none',
    backgroundColor: boxStyle.backgroundColor,
    opacity: boxStyle.backgroundOpacity,
    borderWidth: boxStyle.borderWidth ? boxStyle.borderWidth * scale : undefined,
    borderStyle: boxStyle.borderStyle,
    borderColor: boxStyle.borderColor,
    borderRadius: boxStyle.borderRadius ? boxStyle.borderRadius * scale : undefined,
    paddingTop: boxStyle.padding?.top ? boxStyle.padding.top * scale : undefined,
    paddingRight: boxStyle.padding?.right ? boxStyle.padding.right * scale : undefined,
    paddingBottom: boxStyle.padding?.bottom ? boxStyle.padding.bottom * scale : undefined,
    paddingLeft: boxStyle.padding?.left ? boxStyle.padding.left * scale : undefined,
  };

  return (
    <>
      <div
        ref={containerRef}
        className={`rich-text-editor ${isSelected ? 'selected' : ''}`}
        style={containerStyle}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      >
        <TipTapEditor
          content={annotation.content}
          onChange={handleContentChange}
          isEditable={isEditing}
          textStyle={textStyle}
          scale={scale}
        />
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <TextBoxContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onEdit={() => setIsEditing(true)}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onBringToFront={handleBringToFront}
          onSendToBack={handleSendToBack}
          onProperties={() => {
            setShowBoxProperties(true);
            setShowTextProperties(true);
          }}
        />
      )}

      {/* Properties Panels */}
      {showBoxProperties && (
        <div style={{ position: 'absolute', top: scaledRect.top, left: scaledRect.left + scaledRect.width + 20, zIndex: 1000 }}>
          <BoxPropertiesPanel
            annotation={annotation}
            onClose={() => setShowBoxProperties(false)}
          />
        </div>
      )}

      {showTextProperties && (
        <div style={{ position: 'absolute', top: scaledRect.top + 300, left: scaledRect.left + scaledRect.width + 20, zIndex: 1000 }}>
          <TextPropertiesPanel
            annotation={annotation}
            onClose={() => setShowTextProperties(false)}
          />
        </div>
      )}
    </>
  );
}
