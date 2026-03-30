import { useCallback } from 'react';
import type { FreeTextAnnotation, TextStyle } from '../../annotations/types';
import { DEFAULT_TEXT_STYLE, AVAILABLE_FONTS } from '../../annotations/types';
import { useAnnotationStore } from '../../store';
import { useAnnotationHistoryStore } from '../../store';
import './TextPropertiesPanel.css';

interface TextPropertiesPanelProps {
  annotation: FreeTextAnnotation;
  onClose?: () => void;
}

// Common text colors
const COLOR_PRESETS = [
  '#000000', '#333333', '#666666', '#999999',
  '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
  '#FF00FF', '#00FFFF', '#800000', '#008000',
  '#000080', '#808000', '#800080', '#008080',
];

export function TextPropertiesPanel({ annotation, onClose }: TextPropertiesPanelProps) {
  const { updateAnnotation } = useAnnotationStore();
  const { recordUpdate } = useAnnotationHistoryStore();

  const textStyle: TextStyle = annotation.textStyle || DEFAULT_TEXT_STYLE;

  // Update text style with undo support
  const handleStyleChange = useCallback(
    (updates: Partial<TextStyle>) => {
      const previousState = { ...annotation };
      const newTextStyle = { ...textStyle, ...updates };
      updateAnnotation(annotation.id, { textStyle: newTextStyle });
      recordUpdate({ ...annotation, textStyle: newTextStyle } as any, previousState as any);
    },
    [annotation, textStyle, updateAnnotation, recordUpdate]
  );

  return (
    <div className="text-properties-panel">
      <div className="panel-header">
        <h3>Text Properties</h3>
        {onClose && (
          <button className="close-btn" onClick={onClose} title="Close">
            &times;
          </button>
        )}
      </div>

      <div className="panel-content">
        {/* Font Family & Style */}
        <div className="property-section">
          <div className="section-title">Typography</div>
          <select
            className="font-select"
            value={textStyle.fontFamily || 'Helvetica'}
            onChange={(e) => handleStyleChange({ fontFamily: e.target.value })}
            style={{ fontFamily: textStyle.fontFamily || 'Helvetica' }}
          >
            {AVAILABLE_FONTS.map((font) => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>

          <div className="style-controls">
            <button
              className={`style-btn ${textStyle.fontWeight === 'bold' ? 'active' : ''}`}
              onClick={() => handleStyleChange({ fontWeight: textStyle.fontWeight === 'bold' ? 'normal' : 'bold' })}
              title="Bold"
              style={{ fontWeight: 'bold' }}
            >
              B
            </button>
            <button
              className={`style-btn ${textStyle.fontStyle === 'italic' ? 'active' : ''}`}
              onClick={() => handleStyleChange({ fontStyle: textStyle.fontStyle === 'italic' ? 'normal' : 'italic' })}
              title="Italic"
              style={{ fontStyle: 'italic' }}
            >
              I
            </button>
            <button
              className={`style-btn ${textStyle.textDecoration === 'underline' ? 'active' : ''}`}
              onClick={() => handleStyleChange({ textDecoration: textStyle.textDecoration === 'underline' ? 'none' : 'underline' })}
              title="Underline"
              style={{ textDecoration: 'underline' }}
            >
              U
            </button>
            <button
              className={`style-btn ${textStyle.textDecoration === 'line-through' ? 'active' : ''}`}
              onClick={() => handleStyleChange({ textDecoration: textStyle.textDecoration === 'line-through' ? 'none' : 'line-through' })}
              title="Strikethrough"
              style={{ textDecoration: 'line-through' }}
            >
              S
            </button>
          </div>

          <div className="align-controls">
            <button
              className={`align-btn ${textStyle.textAlign === 'left' ? 'active' : ''}`}
              onClick={() => handleStyleChange({ textAlign: 'left' })}
              title="Align Left"
            >
              L
            </button>
            <button
              className={`align-btn ${textStyle.textAlign === 'center' ? 'active' : ''}`}
              onClick={() => handleStyleChange({ textAlign: 'center' })}
              title="Align Center"
            >
              C
            </button>
            <button
              className={`align-btn ${textStyle.textAlign === 'right' ? 'active' : ''}`}
              onClick={() => handleStyleChange({ textAlign: 'right' })}
              title="Align Right"
            >
              R
            </button>
            <button
              className={`align-btn ${textStyle.textAlign === 'justify' ? 'active' : ''}`}
              onClick={() => handleStyleChange({ textAlign: 'justify' })}
              title="Justify"
            >
              J
            </button>
          </div>

          <div className="numeric-controls">
            <div className="numeric-field">
              <label title="Font Size">Size</label>
              <input
                type="number"
                value={textStyle.fontSize || 12}
                min={1}
                max={200}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val > 0) {
                    handleStyleChange({ fontSize: val });
                  }
                }}
              />
              <span className="unit">pt</span>
            </div>
            <div className="numeric-field">
              <label title="Line Height">Line</label>
              <input
                type="number"
                value={textStyle.lineHeight || 1.2}
                min={0.5}
                max={3}
                step={0.1}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val > 0) {
                    handleStyleChange({ lineHeight: val });
                  }
                }}
              />
              <span className="unit">em</span>
            </div>
          </div>
        </div>

        {/* Color */}
        <div className="property-section">
          <div className="section-title">Color</div>
          <div className="color-row">
            <div className="color-input-group">
              <input
                type="color"
                value={textStyle.color || '#000000'}
                onChange={(e) => handleStyleChange({ color: e.target.value })}
                className="color-input"
              />
              <input
                type="text"
                value={textStyle.color || '#000000'}
                onChange={(e) => handleStyleChange({ color: e.target.value })}
                className="color-text"
              />
            </div>
          </div>
          <div className="color-presets">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                className={`color-preset ${color === textStyle.color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => handleStyleChange({ color })}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
