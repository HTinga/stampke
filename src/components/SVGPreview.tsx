
import React, { forwardRef } from 'react';
import { StampConfig, StampShape, BorderStyle } from '../types';

interface SVGPreviewProps {
  config: StampConfig;
  className?: string;
  onUpdateConfig?: (updates: Partial<StampConfig>) => void;
}

const SVGPreview = forwardRef<SVGSVGElement, SVGPreviewProps>(({ config, className, onUpdateConfig }, ref) => {
    const {
    shape,
    primaryText = '',
    secondaryText = '',
    innerTopText = '',
    innerBottomText = '',
    centerText = '',
    centerSubText = '',
    primaryFontFamily,
    secondaryFontFamily,
    innerTopFontFamily,
    innerBottomFontFamily,
    centerFontFamily,
    centerSubFontFamily,
    primaryXOffset,
    primaryYOffset,
    secondaryXOffset,
    secondaryYOffset,
    innerTopXOffset,
    innerTopYOffset,
    innerBottomXOffset,
    innerBottomYOffset,
    centerXOffset,
    centerYOffset,
    centerSubXOffset,
    centerSubYOffset,
    fontSize,
    letterSpacing,
    letterStretch,
    borderColor,
    secondaryColor,
    borderWidth,
    borderOffset,
    borderStyle,
    fontFamily,
    showSignatureLine,
    showDateLine,
    showStars,
    showInnerLine,
    innerLineOffset,
    innerLineWidth,
    innerTextColor,
    innerTextSize,
    innerTextIntensity,
    starCount,
    starSize,
    starOffset,
    distressLevel,
    isVintage,
    wetInk,
    logoUrl,
    embeddedSignatureUrl,
    showEmbeddedSignature,
    signatureX,
    signatureY,
    signatureScale,
    doubleBorder,
    doubleBorderOffset,
    doubleBorderThickness,
    primaryFontSize,
    secondaryFontSize,
    innerTopFontSize,
    innerBottomFontSize,
    centerFontSize,
    centerSubFontSize,
    primaryBold,
    secondaryBold,
    innerTopBold,
    innerBottomBold,
    centerBold,
    centerSubBold,
    customElements,
    previewBg,
    stretchX,
    stretchY,
    primaryColor,
    secondaryColor: configSecondaryColor,
    innerTopColor,
    innerBottomColor,
    centerColor,
    centerSubColor,
    logoXOffset,
    logoYOffset,
    selectedDate
  } = config;

  // Internal coordinate system to prevent clipping
  const INTERNAL_SIZE = 600;
  const viewBox = `0 0 ${INTERNAL_SIZE} ${INTERNAL_SIZE}`;
  const cx = INTERNAL_SIZE / 2;
  const cy = INTERNAL_SIZE / 2;
  
  // Dynamic sizing based on shape to ensure containment
  // Adjust base radius based on borderWidth to prevent text overlap
  const baseR = (INTERNAL_SIZE / 2) - 60;
  const r = shape === StampShape.OVAL ? (baseR - borderWidth/2) * 0.8 : (baseR - borderWidth/2);
  const borderR = r + borderOffset;

  const getFinalColors = () => {
    if (isVintage) return { border: '#111827', secondary: '#111827' };
    return { border: borderColor, secondary: secondaryColor };
  };

  const finalColors = getFinalColors();

  const [dragging, setDragging] = React.useState<{ 
    id: string, 
    type: 'custom' | 'primary' | 'secondary' | 'innerTop' | 'innerBottom' | 'center' | 'centerSub' | 'textBox' | 'signature' | 'logo',
    offsetX: number,
    offsetY: number,
    startX: number,
    startY: number
  } | null>(null);

  const handleMouseDown = (e: React.MouseEvent, type: any, id?: string) => {
    if (!onUpdateConfig) return;
    e.preventDefault();
    e.stopPropagation();
    
    const svg = (ref as any).current;
    if (!svg) return;
    
    const CTM = svg.getScreenCTM();
    if (!CTM) return;
    
    const x = (e.clientX - CTM.e) / CTM.a;
    const y = (e.clientY - CTM.f) / CTM.d;

    let initialX = x;
    let initialY = y;

    if (type === 'custom') {
      const el = config.customElements.find(e => e.id === id);
      initialX = el?.x ?? x;
      initialY = el?.y ?? y;
    } else if (type === 'textBox') {
      initialX = config.textBoxX ?? cx;
      initialY = config.textBoxY ?? cy;
    } else if (type === 'signature') {
      initialX = config.signatureX + cx;
      initialY = config.signatureY + cy;
    } else if (type === 'logo') {
      initialX = (config.logoXOffset || 0) + cx;
      initialY = (config.logoYOffset || 0) + cy;
    } else {
      const fieldX = `${type}XOffset` as keyof StampConfig;
      const fieldY = `${type}YOffset` as keyof StampConfig;
      initialX = ((config[fieldX] as number) ?? 0) + cx;
      initialY = ((config[fieldY] as number) ?? 0) + cy;
    }

    setDragging({ 
      id: id || '', 
      type,
      offsetX: x - initialX,
      offsetY: y - initialY,
      startX: initialX,
      startY: initialY
    });
  };

  React.useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      
      const svg = (ref as any).current;
      if (!svg) return;
      
      const CTM = svg.getScreenCTM();
      if (!CTM) return;
      
      const mouseX = (e.clientX - CTM.e) / CTM.a;
      const mouseY = (e.clientY - CTM.f) / CTM.d;

      const x = mouseX - dragging.offsetX;
      const y = mouseY - dragging.offsetY;

      // Update the visual position without committing to history
      if (dragging.type === 'custom') {
         const el = svg.querySelector(`[data-drag-id="${dragging.id}"]`);
         if (el) {
           if (el.tagName === 'image' || el.tagName === 'text') {
             el.setAttribute('x', x.toString());
             el.setAttribute('y', y.toString());
           }
         }
      } else if (['primary', 'secondary', 'innerTop', 'innerBottom', 'center', 'centerSub'].includes(dragging.type)) {
         // Custom offsets are relative to center normally, so x - cx
         // But for now, let's just use DOM updates if they have IDs
         const el = svg.querySelector(`[data-drag-id="${dragging.type}"]`);
         if (el) {
            if (el.tagName === 'text' || el.tagName === 'g') {
              // This is a bit complex for circular paths, but let's try basic transform for center
              if (dragging.type.startsWith('center')) {
                 el.setAttribute('transform', `translate(${x - cx}, ${y - cy})`);
              }
            }
         }
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (!dragging || !onUpdateConfig) {
          setDragging(null);
          return;
      }

      const svg = (ref as any).current;
      if (!svg) { setDragging(null); return; }
      
      const CTM = svg.getScreenCTM();
      if (!CTM) { setDragging(null); return; }
      
      const mouseX = (e.clientX - CTM.e) / CTM.a;
      const mouseY = (e.clientY - CTM.f) / CTM.d;

      const x = mouseX - dragging.offsetX;
      const y = mouseY - dragging.offsetY;

      // Commit the final position to history
      if (dragging.type === 'custom') {
          const updatedElements = config.customElements.map(el => 
            el.id === dragging.id ? { ...el, x, y } : el
          );
          onUpdateConfig({ customElements: updatedElements });
      } else if (['primary', 'secondary', 'innerTop', 'innerBottom', 'center', 'centerSub'].includes(dragging.type)) {
          const fieldX = `${dragging.type}XOffset` as keyof StampConfig;
          const fieldY = `${dragging.type}YOffset` as keyof StampConfig;
          onUpdateConfig({ 
            [fieldX]: x - cx, 
            [fieldY]: y - cy 
          } as any);
      } else if (dragging.type === 'signature') {
          onUpdateConfig({ signatureX: x - cx, signatureY: y - cy });
      } else if (dragging.type === 'logo') {
          onUpdateConfig({ logoXOffset: x - cx, logoYOffset: y - cy });
      }
      
      setDragging(null);
    };

    if (dragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [dragging, config, onUpdateConfig, cx, cy]);

  const [isEditingStatus, setIsEditingStatus] = React.useState(false);

  const handleMouseUp = () => {
    setDragging(null);
  };

  const textBaseStyle = { 
    fontFamily, 
    fontWeight: 'bold', 
    textTransform: 'uppercase' as const,
    letterSpacing: `${letterSpacing}px`,
    filter: wetInk ? "url(#wetInkFilter)" : "url(#distressFilter)"
  };

  const getStrokeDashArray = () => {
    if (borderStyle === BorderStyle.DOTTED) return '2, 4';
    if (borderStyle === BorderStyle.DASHED) return '8, 4';
    return 'none';
  };

  const renderShape = () => {
    const commonProps = {
      fill: "none",
      stroke: finalColors.border,
      strokeWidth: borderWidth,
      strokeDasharray: getStrokeDashArray(),
      filter: wetInk ? "url(#wetInkFilter)" : "url(#distressFilter)"
    };

    const innerLineProps = {
      ...commonProps,
      strokeWidth: innerLineWidth || borderWidth * 0.6,
      strokeDasharray: 'none'
    };

    const doubleBorderProps = {
      ...commonProps,
      stroke: config.doubleBorderColor || finalColors.border,
      strokeWidth: doubleBorderThickness || borderWidth * 0.5,
      strokeDasharray: (config.doubleBorderStyle || BorderStyle.SINGLE) === BorderStyle.DASHED ? '10,10' : 'none'
    };

    switch (shape) {
      case StampShape.ROUND:
        return (
          <>
            <circle cx={cx} cy={cy} r={borderR} {...commonProps} />
            {showInnerLine && (
              <circle cx={cx} cy={cy} r={borderR - innerLineOffset} {...innerLineProps} />
            )}
            {doubleBorder && (
              <circle cx={cx} cy={cy} r={borderR + (config.doubleBorderIsOuter ? (doubleBorderOffset || 10) : -(doubleBorderOffset || 10))} {...doubleBorderProps} />
            )}
          </>
        );
      case StampShape.OVAL:
        const orx = borderR * 1.25;
        const ory = borderR * 0.85;
        return (
          <>
            <ellipse cx={cx} cy={cy} rx={orx} ry={ory} {...commonProps} />
            {showInnerLine && (
              <ellipse cx={cx} cy={cy} rx={orx - innerLineOffset} ry={ory - innerLineOffset} {...innerLineProps} />
            )}
            {doubleBorder && (
              <ellipse cx={cx} cy={cy} rx={orx + (config.doubleBorderIsOuter ? (doubleBorderOffset || 10) : -(doubleBorderOffset || 10))} ry={ory + (config.doubleBorderIsOuter ? (doubleBorderOffset || 10) : -(doubleBorderOffset || 10))} {...doubleBorderProps} />
            )}
          </>
        );
      case StampShape.RECTANGLE:
        const rw = (INTERNAL_SIZE * 0.85) + (borderOffset * 2);
        const rh = (INTERNAL_SIZE * 0.5) + (borderOffset * 2);
        return (
          <>
            <rect x={cx - rw/2} y={cy - rh/2} width={rw} height={rh} rx={4} {...commonProps} />
            {showInnerLine && (
              <rect x={cx - rw/2 + innerLineOffset} y={cy - rh/2 + innerLineOffset} width={rw - innerLineOffset*2} height={rh - innerLineOffset*2} rx={2} {...innerLineProps} />
            )}
            {doubleBorder && (
               <rect 
                 x={cx - rw/2 + (config.doubleBorderIsOuter ? -(doubleBorderOffset || 10) : (doubleBorderOffset || 10))} 
                 y={cy - rh/2 + (config.doubleBorderIsOuter ? -(doubleBorderOffset || 10) : (doubleBorderOffset || 10))} 
                 width={rw + (config.doubleBorderIsOuter ? (doubleBorderOffset || 10)*2 : -(doubleBorderOffset || 10)*2)} 
                 height={rh + (config.doubleBorderIsOuter ? (doubleBorderOffset || 10)*2 : -(doubleBorderOffset || 10)*2)} 
                 rx={2} 
                 {...doubleBorderProps} 
               />
            )}
          </>
        );
      case StampShape.SQUARE:
        const sSize = (r * 1.5) + (borderOffset * 2);
        return (
          <g>
            <rect x={cx - sSize / 2} y={cy - sSize / 2} width={sSize} height={sSize} rx={4} {...commonProps} />
            {showInnerLine && (
              <rect x={cx - sSize / 2 + innerLineOffset} y={cy - sSize / 2 + innerLineOffset} width={sSize - innerLineOffset*2} height={sSize - innerLineOffset*2} rx={2} {...innerLineProps} />
            )}
            {doubleBorder && (
               <rect 
                 x={cx - sSize / 2 + (config.doubleBorderIsOuter ? -(doubleBorderOffset || 10) : (doubleBorderOffset || 10))} 
                 y={cy - sSize / 2 + (config.doubleBorderIsOuter ? -(doubleBorderOffset || 10) : (doubleBorderOffset || 10))} 
                 width={sSize + (config.doubleBorderIsOuter ? (doubleBorderOffset || 10)*2 : -(doubleBorderOffset || 10)*2)} 
                 height={sSize + (config.doubleBorderIsOuter ? (doubleBorderOffset || 10)*2 : -(doubleBorderOffset || 10)*2)} 
                 rx={2} 
                 {...doubleBorderProps} 
               />
            )}
            <text 
              x={cx + (primaryXOffset || 0)} 
              y={cy - sSize/2 + 40 + (primaryYOffset || 0)} 
              fill={primaryColor || finalColors.border} 
              textAnchor="middle" 
              data-drag-id="primary"
              onMouseDown={(e) => handleMouseDown(e, 'primary')}
              style={{ ...textBaseStyle, fontFamily: primaryFontFamily || fontFamily, fontSize: `${primaryFontSize || fontSize * 0.8}px`, fontWeight: primaryBold ? 'bold' : 'normal', cursor: 'move' }} 
              textLength={primaryText.length * (primaryFontSize || fontSize * 0.8) * 0.6 * letterStretch} 
              lengthAdjust="spacingAndGlyphs"
            >
              {primaryText}
            </text>
            {innerTopText && (
              <text 
                x={cx + (innerTopXOffset || 0)} 
                y={cy - sSize/2 + 65 + (innerTopYOffset || 0)} 
                fill={innerTopColor || finalColors.border} 
                textAnchor="middle" 
                data-drag-id="innerTop"
                onMouseDown={(e) => handleMouseDown(e, 'innerTop')}
                style={{ ...textBaseStyle, fontFamily: innerTopFontFamily || fontFamily, fontSize: `${innerTopFontSize || fontSize * 0.55}px`, fontWeight: innerTopBold ? 'bold' : 'normal', cursor: 'move' }}
              >
                {innerTopText}
              </text>
            )}
            <g transform={`translate(${cx + (centerXOffset || 0)}, ${cy + (centerYOffset || 0)})`} data-drag-id="center" onMouseDown={(e) => handleMouseDown(e, 'center')}>
              {logoUrl && (
                <image 
                  href={logoUrl} 
                  data-drag-id="logo"
                  onMouseDown={(e) => handleMouseDown(e, 'logo')}
                  x={-fontSize * 1.5 + (logoXOffset || 0)} 
                  y={-fontSize * 1.5 + (logoYOffset || 0)} 
                  width={fontSize * 3} 
                  height={fontSize * 3} 
                  style={{ filter: `grayscale(1) contrast(8)`, cursor: 'move' }} 
                />
              )}
              <text 
                x={0} 
                y={(centerFontSize || fontSize * 1.5) * 0.2} 
                fill={centerColor || finalColors.secondary} 
                textAnchor="middle" 
                style={{ ...textBaseStyle, fontFamily: centerFontFamily || fontFamily, fontSize: `${centerFontSize || fontSize * 1.5}px`, fontWeight: centerBold ? 'bold' : 'normal' }}
              >
                {centerText}
              </text>
            </g>
            {innerBottomText && (
              <text 
                x={cx + (innerBottomXOffset || 0)} 
                y={cy + sSize/2 - 45 + (innerBottomYOffset || 0)} 
                fill={innerBottomColor || finalColors.border} 
                textAnchor="middle" 
                data-drag-id="innerBottom"
                onMouseDown={(e) => handleMouseDown(e, 'innerBottom')}
                style={{ ...textBaseStyle, fontFamily: innerBottomFontFamily || fontFamily, fontSize: `${innerBottomFontSize || fontSize * 0.55}px`, fontWeight: innerBottomBold ? 'bold' : 'normal', cursor: 'move' }}
              >
                {innerBottomText}
              </text>
            )}
            <text 
              x={cx + (secondaryXOffset || 0)} 
              y={cy + sSize/2 - 25 + (secondaryYOffset || 0)} 
              fill={secondaryColor || finalColors.border} 
              textAnchor="middle" 
              data-drag-id="secondary"
              onMouseDown={(e) => handleMouseDown(e, 'secondary')}
              style={{ ...textBaseStyle, fontFamily: secondaryFontFamily || fontFamily, fontSize: `${secondaryFontSize || fontSize * 0.6}px`, fontWeight: secondaryBold ? 'bold' : 'normal', cursor: 'move' }}
            >
              {secondaryText}
            </text>
          </g>
        );
      default:
        return null;
    }
  };

  const renderText = () => {
    if (shape === StampShape.ROUND || shape === StampShape.OVAL) {
      const rx = shape === StampShape.ROUND ? r - (fontSize * 0.6) : (r * 1.25) - (fontSize * 0.6);
      const ry = shape === StampShape.ROUND ? r - (fontSize * 0.6) : (r * 0.85) - (fontSize * 0.6);
      
      const irx = rx - (fontSize * 0.85);
      const iry = ry - (fontSize * 0.85);

      return (
        <g>
          <defs>
            <path id="pathTop" d={`M ${cx - rx},${cy} A ${rx},${ry} 0 1,1 ${cx + rx},${cy}`} />
            <path id="pathBottom" d={`M ${cx - rx},${cy} A ${rx},${ry} 0 1,0 ${cx + rx},${cy}`} />
            <path id="pathInnerTop" d={`M ${cx - irx},${cy} A ${irx},${iry} 0 1,1 ${cx + irx},${cy}`} />
            <path id="pathInnerBottom" d={`M ${cx - irx},${cy} A ${irx},${iry} 0 1,0 ${cx + irx},${cy}`} />
          </defs>
          
          <text 
            fill={primaryColor || finalColors.border} 
            data-drag-id="primary"
            onMouseDown={(e) => handleMouseDown(e, 'primary')}
            style={{ ...textBaseStyle, fontFamily: primaryFontFamily || fontFamily, fontSize: `${primaryFontSize || fontSize}px`, fontWeight: primaryBold ? 'bold' : 'normal', cursor: 'move' }} 
            textLength={primaryText.length * (primaryFontSize || fontSize) * 0.6 * letterStretch} 
            lengthAdjust="spacingAndGlyphs"
            transform={`translate(${primaryXOffset || 0}, ${primaryYOffset || 0})`}
          >
            <textPath xlinkHref="#pathTop" startOffset="50%" textAnchor="middle">
              {primaryText}
            </textPath>
          </text>
          <text 
            fill={secondaryColor || finalColors.border} 
            data-drag-id="secondary"
            onMouseDown={(e) => handleMouseDown(e, 'secondary')}
            style={{ ...textBaseStyle, fontFamily: secondaryFontFamily || fontFamily, fontSize: `${secondaryFontSize || fontSize * 0.75}px`, fontWeight: secondaryBold ? 'bold' : 'normal', cursor: 'move' }} 
            textLength={secondaryText.length * (secondaryFontSize || fontSize * 0.75) * 0.45 * letterStretch} 
            lengthAdjust="spacingAndGlyphs"
            transform={`translate(${secondaryXOffset || 0}, ${secondaryYOffset || 0})`}
          >
            <textPath xlinkHref="#pathBottom" startOffset="50%" textAnchor="middle" dominantBaseline="hanging">
              {secondaryText}
            </textPath>
          </text>
          
          {innerTopText && (
            <text 
              fill={innerTopColor || innerTextColor || finalColors.border} 
              data-drag-id="innerTop"
              onMouseDown={(e) => handleMouseDown(e, 'innerTop')}
              style={{ 
                ...textBaseStyle, 
                fontFamily: innerTopFontFamily || fontFamily,
                fontSize: `${innerTopFontSize || innerTextSize || fontSize * 0.55}px`, 
                fontWeight: 'normal',
                opacity: innerTextIntensity ?? 1,
                cursor: 'move'
              }}
              transform={`translate(${innerTopXOffset || 0}, ${innerTopYOffset || 0})`}
            >
              <textPath xlinkHref="#pathInnerTop" startOffset="50%" textAnchor="middle">
                {innerTopText}
              </textPath>
            </text>
          )}
          {innerBottomText && (
            <text 
              fill={innerBottomColor || innerTextColor || finalColors.border} 
              data-drag-id="innerBottom"
              onMouseDown={(e) => handleMouseDown(e, 'innerBottom')}
              style={{ 
                ...textBaseStyle, 
                fontFamily: innerBottomFontFamily || fontFamily,
                fontSize: `${innerBottomFontSize || innerTextSize || fontSize * 0.55}px`, 
                fontWeight: innerBottomBold ? 'bold' : 'normal',
                opacity: innerTextIntensity ?? 1,
                cursor: 'move'
              }}
              transform={`translate(${innerBottomXOffset || 0}, ${innerBottomYOffset || 0})`}
            >
              <textPath xlinkHref="#pathInnerBottom" startOffset="50%" textAnchor="middle" dominantBaseline="hanging">
                {innerBottomText}
              </textPath>
            </text>
          )}

          {showStars && (
            <g fill={finalColors.border}>
              {Array.from({ length: starCount || 2 }).map((_, i) => {
                const angle = i === 0 ? 180 : 0; // Simple left/right for 2 stars
                // For more stars, we could distribute them along the path
                const xPos = i === 0 ? cx - rx - 25 - starOffset : cx + rx + 25 + starOffset;
                return (
                  <text 
                    key={i}
                    x={xPos} 
                    y={cy + 8} 
                    fontSize={starSize || fontSize * 0.8} 
                    textAnchor="middle"
                    style={{ filter: wetInk ? "url(#wetInkFilter)" : "url(#distressFilter)" }}
                  >
                    ★
                  </text>
                );
              })}
            </g>
          )}
          
            <g transform={`translate(${cx + (centerXOffset || 0)}, ${cy + (centerYOffset || 0)})`} data-drag-id="center" onMouseDown={(e) => handleMouseDown(e, 'center')}>
              {logoUrl && (
                <image 
                  href={logoUrl} 
                  data-drag-id="logo"
                  onMouseDown={(e) => handleMouseDown(e, 'logo')}
                  x={-fontSize * 2 + (logoXOffset || 0)} 
                  y={-fontSize * 4.5 + (logoYOffset || 0)} 
                  width={fontSize * 4} 
                  height={fontSize * 4} 
                  style={{ opacity: 0.9, filter: `grayscale(1) contrast(8)`, cursor: 'move' }} 
                />
              )}
              <g transform={`translate(0, ${logoUrl ? fontSize * 0.5 : 0})`}>
                {showDateLine && (
                  <text 
                    x={0} 
                    y={-(centerSubFontSize || fontSize * 0.8)} 
                    fill={centerSubColor || finalColors.secondary} 
                    textAnchor="middle" 
                    data-drag-id="centerSub"
                    onMouseDown={(e) => handleMouseDown(e, 'centerSub')}
                    style={{ ...textBaseStyle, fontFamily: centerSubFontFamily || fontFamily, fontSize: `${centerSubFontSize || fontSize * 0.7}px`, fontWeight: centerSubBold ? 'bold' : 'normal', cursor: 'move' }}
                  >
                    {selectedDate || centerSubText || 'DATE: .................'}
                  </text>
                )}
                <text 
                  x={0} 
                  y={(centerFontSize || fontSize * 1.1) * 0.2} 
                  fill={centerColor || finalColors.secondary} 
                  textAnchor="middle" 
                  style={{ ...textBaseStyle, fontFamily: centerFontFamily || fontFamily, fontSize: `${centerFontSize || fontSize * 1.1}px`, fontWeight: centerBold ? 'bold' : 'normal' }}
                >
                  {centerText}
                </text>
                {!showDateLine && centerSubText && (
                    <text 
                      x={0} 
                      y={centerSubFontSize || fontSize * 1.1} 
                      fill={centerSubColor || finalColors.border} 
                      textAnchor="middle" 
                      style={{ ...textBaseStyle, fontFamily: centerSubFontFamily || fontFamily, fontSize: `${centerSubFontSize || fontSize * 0.8}px`, fontWeight: centerSubBold ? 'bold' : 'normal' }}
                    >
                      {selectedDate || centerSubText}
                    </text>
                )}
              {showSignatureLine && (
                <g>
                  {showEmbeddedSignature && embeddedSignatureUrl && (
                    <image 
                      href={embeddedSignatureUrl} 
                      x={(signatureX || 0) - (fontSize * 2.5 * (signatureScale || 1))} 
                      y={(signatureY || 0) + (fontSize * 0.5)} 
                      width={fontSize * 5 * (signatureScale || 1)} 
                      height={fontSize * 2.5 * (signatureScale || 1)} 
                      style={{ opacity: 0.85, filter: "grayscale(1) contrast(1.2)" }} 
                    />
                  )}
                  <text 
                    x={0} 
                    y={fontSize * 2.4} 
                    fill={finalColors.border} 
                    textAnchor="middle" 
                    data-drag-id="signature"
                    onMouseDown={(e) => handleMouseDown(e, 'signature')}
                    style={{ ...textBaseStyle, fontSize: `${fontSize * 0.5}px`, cursor: 'move' }}
                  >
                    SIGN: .................................
                  </text>
                </g>
              )}
            </g>
          </g>
        </g>
      );
    }

    const rh = INTERNAL_SIZE * 0.5;
    return (
      <g>
        <text 
          x={cx + (primaryXOffset || 0)} 
          y={cy - rh/2 + 40 + (primaryYOffset || 0)} 
          fill={primaryColor || finalColors.border} 
          textAnchor="middle" 
          data-drag-id="primary"
          onMouseDown={(e) => handleMouseDown(e, 'primary')}
          style={{ ...textBaseStyle, fontFamily: primaryFontFamily || fontFamily, fontSize: `${primaryFontSize || fontSize * 0.8}px`, fontWeight: primaryBold ? 'bold' : 'normal', cursor: 'move' }} 
          textLength={primaryText.length * (primaryFontSize || fontSize * 0.8) * 0.5 * letterStretch} 
          lengthAdjust="spacingAndGlyphs"
        >
          {primaryText}
        </text>
        
        {innerTopText && (
          <text 
            x={cx + (innerTopXOffset || 0)} 
            y={cy - rh/2 + 65 + (innerTopYOffset || 0)} 
            fill={innerTopColor || finalColors.border} 
            textAnchor="middle" 
            data-drag-id="innerTop"
            onMouseDown={(e) => handleMouseDown(e, 'innerTop')}
            style={{ ...textBaseStyle, fontFamily: innerTopFontFamily || fontFamily, fontSize: `${innerTopFontSize || fontSize * 0.55}px`, fontWeight: innerTopBold ? 'bold' : 'normal', cursor: 'move' }}
          >
            {innerTopText}
          </text>
        )}
        
        <g transform={`translate(${cx + (centerXOffset || 0)}, ${cy + (centerYOffset || 0)})`} data-drag-id="center" onMouseDown={(e) => handleMouseDown(e, 'center')}>
          {logoUrl && (
            <image 
              href={logoUrl} 
              data-drag-id="logo"
              onMouseDown={(e) => handleMouseDown(e, 'logo')}
              x={-fontSize * 1.5 + (logoXOffset || 0)} 
              y={-fontSize * 4.8 + (logoYOffset || 0)} 
              width={fontSize * 3} 
              height={fontSize * 3} 
              style={{ filter: `grayscale(1) contrast(8)`, cursor: 'move' }} 
            />
          )}
          <text 
            x={0} 
            y={(centerFontSize || fontSize * 1.5) * 0.2} 
            fill={centerColor || finalColors.secondary} 
            textAnchor="middle" 
            style={{ ...textBaseStyle, fontFamily: centerFontFamily || fontFamily, fontSize: `${centerFontSize || fontSize * 1.5}px`, fontWeight: centerBold ? 'bold' : 'normal' }}
          >
            {centerText}
          </text>
        </g>

          <text 
            x={cx + (centerSubXOffset || 0)} 
            y={cy + (centerSubFontSize || fontSize * 1.2) + (centerSubYOffset || 0)} 
            fill={centerSubColor || finalColors.secondary} 
            textAnchor="middle" 
            style={{ ...textBaseStyle, fontFamily: centerSubFontFamily || fontFamily, fontSize: `${centerSubFontSize || fontSize}px`, fontWeight: centerSubBold ? 'bold' : 'normal' }}
          >
            {selectedDate || centerSubText || 'DATE: ........................'}
          </text>

        {showSignatureLine && (
          <g>
            {showEmbeddedSignature && embeddedSignatureUrl && (
              <image 
                href={embeddedSignatureUrl} 
                data-drag-id="signature"
                onMouseDown={(e) => handleMouseDown(e, 'signature')}
                x={cx + (signatureX || 0) - (fontSize * 3.5 * (signatureScale || 1))} 
                y={cy + (signatureY || 0) + rh/2 - 90} 
                width={fontSize * 7 * (signatureScale || 1)} 
                height={fontSize * 3.5 * (signatureScale || 1)} 
                style={{ opacity: 0.85, filter: "grayscale(1) contrast(1.2)", cursor: 'move' }} 
              />
            )}
            <text x={cx} y={cy + rh/2 - 50} fill={finalColors.border} textAnchor="middle" style={{ ...textBaseStyle, fontSize: `${fontSize * 0.65}px` }}>
              SIGN: .............................................
            </text>
          </g>
        )}

        {innerBottomText && (
          <text 
            x={cx + (innerBottomXOffset || 0)} 
            y={cy + rh/2 - 45 + (innerBottomYOffset || 0)} 
            fill={innerBottomColor || finalColors.border} 
            textAnchor="middle" 
            data-drag-id="innerBottom"
            onMouseDown={(e) => handleMouseDown(e, 'innerBottom')}
            style={{ ...textBaseStyle, fontFamily: innerBottomFontFamily || fontFamily, fontSize: `${innerBottomFontSize || fontSize * 0.55}px`, fontWeight: innerBottomBold ? 'bold' : 'normal', cursor: 'move' }}
          >
            {innerBottomText}
          </text>
        )}

        <text 
          x={cx + (secondaryXOffset || 0)} 
          y={cy + rh/2 - 25 + (secondaryYOffset || 0)} 
          fill={secondaryColor || finalColors.border} 
          textAnchor="middle" 
          data-drag-id="secondary"
          onMouseDown={(e) => handleMouseDown(e, 'secondary')}
          style={{ ...textBaseStyle, fontFamily: secondaryFontFamily || fontFamily, fontSize: `${secondaryFontSize || fontSize * 0.6}px`, fontWeight: secondaryBold ? 'bold' : 'normal', cursor: 'move' }}
        >
          {secondaryText}
        </text>
      </g>
    );
  };

  const renderCustomElements = () => {
    return customElements?.map(el => {
      if (el.type === 'image') {
        return (
          <g key={el.id} transform={`translate(${el.offsetX || 0}, ${el.offsetY || 0})`}>
            <image 
              data-drag-id={el.id}
              onMouseDown={(e) => handleMouseDown(e, 'custom', el.id)}
              href={el.content}
              x={el.x}
              y={el.y}
              width={el.width || 50}
              height={el.height || 50}
              transform={`rotate(${el.rotation || 0}, ${el.x + (el.width || 50)/2}, ${el.y + (el.height || 50)/2}) scale(${el.scale || 1})`}
              style={{ 
                opacity: el.opacity ?? 1,
                cursor: 'move',
                filter: el.isBlackAndWhite 
                  ? `grayscale(1) contrast(${el.contrast || 1.5}) ${wetInk ? "url(#wetInkFilter)" : "url(#distressFilter)"}` 
                  : `contrast(${el.contrast || 1}) ${wetInk ? "url(#wetInkFilter)" : "url(#distressFilter)"}` 
              }}
            />
          </g>
        );
      }
      if (el.type === 'text') {
        const elementColor = el.color || finalColors.border;
        if (el.isCurved) {
          const radius = el.curveRadius || 100;
          const pathId = `path-${el.id}`;
          // Create a circular path centered at (el.x, el.y)
          // We'll use a simple arc for the text path
          const pathData = `M ${el.x - radius},${el.y} A ${radius},${radius} 0 0 1 ${el.x + radius},${el.y}`;
          
          return (
            <g key={el.id}>
              <defs>
                <path id={pathId} d={pathData} />
              </defs>
              <text
                fill={elementColor}
                data-drag-id={el.id}
                onMouseDown={(e) => handleMouseDown(e, 'custom', el.id)}
                style={{ 
                  fontFamily: el.fontFamily || fontFamily, 
                  fontSize: `${el.fontSize || (fontSize * (el.scale || 1))}px`, 
                  fontWeight: el.isBold ? 'bold' : 'normal',
                  opacity: el.opacity ?? 1,
                  filter: wetInk ? "url(#wetInkFilter)" : "url(#distressFilter)",
                  cursor: 'move'
                }}
                transform={`rotate(${el.rotation || 0}, ${el.x}, ${el.y})`}
              >
                <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle">
                  {el.content}
                </textPath>
              </text>
            </g>
          );
        }

        return (
          <g key={el.id} transform={`translate(${el.offsetX || 0}, ${el.offsetY || 0})`}>
            <text
              x={el.x}
              y={el.y}
              fill={elementColor}
              data-drag-id={el.id}
              onMouseDown={(e) => handleMouseDown(e, 'custom', el.id)}
              style={{ 
                fontFamily: el.fontFamily || fontFamily, 
                fontSize: `${el.fontSize || (fontSize * (el.scale || 1))}px`, 
                fontWeight: el.isBold ? 'bold' : 'normal',
                opacity: el.opacity ?? 1,
                filter: wetInk ? "url(#wetInkFilter)" : "url(#distressFilter)",
                cursor: 'move'
              }}
              transform={`rotate(${el.rotation || 0}, ${el.x}, ${el.y})`}
            >
              {el.content}
            </text>
          </g>
        );
      }
      return null;
    });
  };

  const getBgClass = () => {
    switch (previewBg) {
      case 'transparent': return 'bg-transparent';
      case 'white': return 'bg-[#161b22]';
      case 'paper': return 'bg-[#fdfbf7]';
      default: return 'bg-[#0d1117] dark:bg-[#21262d]/50';
    }
  };

  return (
    <svg
      ref={ref}
      viewBox={viewBox}
      width="100%"
      height="100%"
      className={`transition-all duration-300 drop-shadow-sm ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
          <defs>
            <filter id="shadowFilter" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow 
                dx={config.shadowOffsetX || 2} 
                dy={config.shadowOffsetY || 2} 
                stdDeviation={config.shadowBlur || 5} 
                floodColor={config.shadowColor || '#000000'} 
                floodOpacity="0.5" 
              />
            </filter>
            <filter id="distressFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency={0.05 + distressLevel * 0.5} numOctaves="3" seed="5" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale={2 + distressLevel * 15} />
              <feComposite operator="in" in2="SourceGraphic" />
              <feGaussianBlur stdDeviation={distressLevel * 1.5} />
            </filter>
            <filter id="wetInkFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="1" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
              <feGaussianBlur stdDeviation="0.8" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.9" />
              </feComponentTransfer>
            </filter>
          </defs>
          
          {/* Apply stretch transform to the entire stamp content */}
          <g 
            transform={`translate(${cx}, ${cy}) scale(${stretchX || 1}, ${stretchY || 1}) translate(${-cx}, ${-cy})`} 
            style={{ filter: config.showShadow ? 'url(#shadowFilter)' : 'none' }}
          >
            {renderShape()}
            {renderText()}
            {renderCustomElements()}
        </g>
      </svg>
  );
});

export default SVGPreview;
