
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
    primaryText,
    secondaryText,
    innerTopText,
    innerBottomText,
    centerText,
    centerSubText,
    statusText,
    statusFontSize,
    statusFontFamily,
    statusX,
    statusY,
    statusRotation,
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
    customElements,
    previewBg,
    stretchX,
    stretchY
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

  const [dragging, setDragging] = React.useState<{ id: string, type: 'custom' | 'primary' | 'secondary' | 'innerTop' | 'innerBottom' | 'center' | 'centerSub' | 'status' } | null>(null);

  const handleMouseDown = (e: React.MouseEvent, type: any, id?: string) => {
    if (!onUpdateConfig) return;
    e.stopPropagation();
    setDragging({ id: id || '', type });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !onUpdateConfig) return;
    
    const svg = (ref as any).current;
    if (!svg) return;
    
    const CTM = svg.getScreenCTM();
    if (!CTM) return;
    
    const x = (e.clientX - CTM.e) / CTM.a;
    const y = (e.clientY - CTM.f) / CTM.d;

    if (dragging.type === 'custom') {
      onUpdateConfig({
        customElements: config.customElements.map(el => 
          el.id === dragging.id ? { ...el, x, y } : el
        )
      });
    } else {
      const fieldX = `${dragging.type}XOffset` as keyof StampConfig;
      const fieldY = `${dragging.type}YOffset` as keyof StampConfig;
      
      // For status text, we use statusX and statusY directly
      if (dragging.type === 'status') {
        onUpdateConfig({ statusX: x, statusY: y });
      } else {
        // For others, we store as offset from their default position
        // This is a bit tricky because default positions are calculated during render
        // Let's just store absolute x,y for now if possible, or relative to center
        onUpdateConfig({ [fieldX]: x - cx, [fieldY]: y - cy } as any);
      }
    }
  };

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

    switch (shape) {
      case StampShape.ROUND:
        return (
          <>
            <circle cx={cx} cy={cy} r={borderR} {...commonProps} />
            {showInnerLine && (
              <circle cx={cx} cy={cy} r={borderR - innerLineOffset} {...innerLineProps} />
            )}
            {borderStyle === BorderStyle.DOUBLE && (
              <circle cx={cx} cy={cy} r={borderR - borderWidth - 6} {...commonProps} strokeWidth={borderWidth * 0.7} />
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
            {borderStyle === BorderStyle.DOUBLE && (
              <ellipse cx={cx} cy={cy} rx={orx - borderWidth - 6} ry={ory - borderWidth - 6} {...commonProps} strokeWidth={borderWidth * 0.7} />
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
            {borderStyle === BorderStyle.DOUBLE && (
               <rect x={cx - rw/2 + 6} y={cy - rh/2 + 6} width={rw - 12} height={rh - 12} rx={2} {...commonProps} strokeWidth={borderWidth * 0.5} />
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
            <text 
              x={cx + (primaryXOffset || 0)} 
              y={cy - sSize/2 + 40 + (primaryYOffset || 0)} 
              fill={finalColors.border} 
              textAnchor="middle" 
              onMouseDown={(e) => handleMouseDown(e, 'primary')}
              style={{ ...textBaseStyle, fontFamily: primaryFontFamily || fontFamily, fontSize: `${fontSize * 0.8}px`, cursor: 'move' }} 
              textLength={primaryText.length * fontSize * 0.5 * letterStretch} 
              lengthAdjust="spacingAndGlyphs"
            >
              {primaryText}
            </text>
            {innerTopText && (
              <text 
                x={cx + (innerTopXOffset || 0)} 
                y={cy - sSize/2 + 65 + (innerTopYOffset || 0)} 
                fill={finalColors.border} 
                textAnchor="middle" 
                onMouseDown={(e) => handleMouseDown(e, 'innerTop')}
                style={{ ...textBaseStyle, fontFamily: innerTopFontFamily || fontFamily, fontSize: `${fontSize * 0.55}px`, fontWeight: 'normal', cursor: 'move' }}
              >
                {innerTopText}
              </text>
            )}
            <g transform={`translate(${cx + (centerXOffset || 0)}, ${cy + (centerYOffset || 0)})`}>
              {logoUrl && (
                <image 
                  href={logoUrl} 
                  x={-fontSize * 1.5} 
                  y={-fontSize * 1.5} 
                  width={fontSize * 3} 
                  height={fontSize * 3} 
                  style={{ filter: `grayscale(1) contrast(8)` }} 
                />
              )}
              <text 
                x={0} 
                y={fontSize * 0.2} 
                fill={finalColors.secondary} 
                textAnchor="middle" 
                onMouseDown={(e) => handleMouseDown(e, 'center')}
                style={{ ...textBaseStyle, fontFamily: centerFontFamily || fontFamily, fontSize: `${fontSize * 1.5}px`, cursor: 'move' }}
              >
                {centerText}
              </text>
            </g>
            {innerBottomText && (
              <text 
                x={cx + (innerBottomXOffset || 0)} 
                y={cy + sSize/2 - 45 + (innerBottomYOffset || 0)} 
                fill={finalColors.border} 
                textAnchor="middle" 
                onMouseDown={(e) => handleMouseDown(e, 'innerBottom')}
                style={{ ...textBaseStyle, fontFamily: innerBottomFontFamily || fontFamily, fontSize: `${fontSize * 0.55}px`, fontWeight: 'normal', cursor: 'move' }}
              >
                {innerBottomText}
              </text>
            )}
            <text 
              x={cx + (secondaryXOffset || 0)} 
              y={cy + sSize/2 - 25 + (secondaryYOffset || 0)} 
              fill={finalColors.border} 
              textAnchor="middle" 
              onMouseDown={(e) => handleMouseDown(e, 'secondary')}
              style={{ ...textBaseStyle, fontFamily: secondaryFontFamily || fontFamily, fontSize: `${fontSize * 0.6}px`, fontWeight: 'normal', cursor: 'move' }}
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
            fill={finalColors.border} 
            onMouseDown={(e) => handleMouseDown(e, 'primary')}
            style={{ ...textBaseStyle, fontFamily: primaryFontFamily || fontFamily, fontSize: `${fontSize}px`, cursor: 'move' }} 
            textLength={primaryText.length * fontSize * 0.6 * letterStretch} 
            lengthAdjust="spacingAndGlyphs"
            transform={`translate(${primaryXOffset || 0}, ${primaryYOffset || 0})`}
          >
            <textPath xlinkHref="#pathTop" startOffset="50%" textAnchor="middle">
              {primaryText}
            </textPath>
          </text>
          <text 
            fill={finalColors.border} 
            onMouseDown={(e) => handleMouseDown(e, 'secondary')}
            style={{ ...textBaseStyle, fontFamily: secondaryFontFamily || fontFamily, fontSize: `${fontSize * 0.75}px`, cursor: 'move' }} 
            textLength={secondaryText.length * fontSize * 0.45 * letterStretch} 
            lengthAdjust="spacingAndGlyphs"
            transform={`translate(${secondaryXOffset || 0}, ${secondaryYOffset || 0})`}
          >
            <textPath xlinkHref="#pathBottom" startOffset="50%" textAnchor="middle" dominantBaseline="hanging">
              {secondaryText}
            </textPath>
          </text>
          
          {innerTopText && (
            <text 
              fill={innerTextColor || finalColors.border} 
              onMouseDown={(e) => handleMouseDown(e, 'innerTop')}
              style={{ 
                ...textBaseStyle, 
                fontFamily: innerTopFontFamily || fontFamily,
                fontSize: `${innerTextSize || fontSize * 0.55}px`, 
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
              fill={innerTextColor || finalColors.border} 
              onMouseDown={(e) => handleMouseDown(e, 'innerBottom')}
              style={{ 
                ...textBaseStyle, 
                fontFamily: innerBottomFontFamily || fontFamily,
                fontSize: `${innerTextSize || fontSize * 0.55}px`, 
                fontWeight: 'normal',
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
          
            <g transform={`translate(${cx + (centerXOffset || 0)}, ${cy + (centerYOffset || 0)})`}>
              {logoUrl && (
                <image 
                  href={logoUrl} 
                  x={-fontSize * 2} 
                  y={-fontSize * 4.5} 
                  width={fontSize * 4} 
                  height={fontSize * 4} 
                  style={{ opacity: 0.9, filter: `grayscale(1) contrast(8)` }} 
                />
              )}
              <g transform={`translate(0, ${logoUrl ? fontSize * 0.5 : 0})`}>
                {showDateLine && (
                  <text 
                    x={0} 
                    y={-fontSize * 0.8} 
                    fill={finalColors.secondary} 
                    textAnchor="middle" 
                    onMouseDown={(e) => handleMouseDown(e, 'centerSub')}
                    style={{ ...textBaseStyle, fontFamily: centerSubFontFamily || fontFamily, fontSize: `${fontSize * 0.7}px`, cursor: 'move' }}
                  >
                    {centerSubText || 'DATE: .................'}
                  </text>
                )}
                <text 
                  x={0} 
                  y={fontSize * 0.2} 
                  fill={finalColors.secondary} 
                  textAnchor="middle" 
                  onMouseDown={(e) => handleMouseDown(e, 'center')}
                  style={{ ...textBaseStyle, fontFamily: centerFontFamily || fontFamily, fontSize: `${fontSize * 1.1}px`, cursor: 'move' }}
                >
                  {centerText}
                </text>
                {!showDateLine && centerSubText && (
                  <text 
                    x={0} 
                    y={fontSize * 1.1} 
                    fill={finalColors.border} 
                    textAnchor="middle" 
                    onMouseDown={(e) => handleMouseDown(e, 'centerSub')}
                    style={{ ...textBaseStyle, fontFamily: centerSubFontFamily || fontFamily, fontSize: `${fontSize * 0.8}px`, fontWeight: 'normal', cursor: 'move' }}
                  >
                    {centerSubText}
                  </text>
                )}
              {showSignatureLine && (
                <g>
                  {showEmbeddedSignature && embeddedSignatureUrl && (
                    <image 
                      href={embeddedSignatureUrl} 
                      x={-fontSize * 2.5} 
                      y={fontSize * 0.5} 
                      width={fontSize * 5} 
                      height={fontSize * 2.5} 
                      style={{ opacity: 0.85, filter: "grayscale(1) contrast(1.2)" }} 
                    />
                  )}
                  <text x={0} y={fontSize * 2.4} fill={finalColors.border} textAnchor="middle" style={{ ...textBaseStyle, fontSize: `${fontSize * 0.5}px` }}>
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
          fill={finalColors.border} 
          textAnchor="middle" 
          onMouseDown={(e) => handleMouseDown(e, 'primary')}
          style={{ ...textBaseStyle, fontFamily: primaryFontFamily || fontFamily, fontSize: `${fontSize * 0.8}px`, cursor: 'move' }} 
          textLength={primaryText.length * fontSize * 0.5 * letterStretch} 
          lengthAdjust="spacingAndGlyphs"
        >
          {primaryText}
        </text>
        
        {innerTopText && (
          <text 
            x={cx + (innerTopXOffset || 0)} 
            y={cy - rh/2 + 65 + (innerTopYOffset || 0)} 
            fill={finalColors.border} 
            textAnchor="middle" 
            onMouseDown={(e) => handleMouseDown(e, 'innerTop')}
            style={{ ...textBaseStyle, fontFamily: innerTopFontFamily || fontFamily, fontSize: `${fontSize * 0.55}px`, fontWeight: 'normal', cursor: 'move' }}
          >
            {innerTopText}
          </text>
        )}
        
        <g transform={`translate(${cx + (centerXOffset || 0)}, ${cy + (centerYOffset || 0)})`}>
          {logoUrl && (
            <image 
              href={logoUrl} 
              x={-fontSize * 1.5} 
              y={-fontSize * 4.8} 
              width={fontSize * 3} 
              height={fontSize * 3} 
              style={{ filter: `grayscale(1) contrast(8)` }} 
            />
          )}
          <text 
            x={0} 
            y={fontSize * 0.2} 
            fill={finalColors.secondary} 
            textAnchor="middle" 
            onMouseDown={(e) => handleMouseDown(e, 'center')}
            style={{ ...textBaseStyle, fontFamily: centerFontFamily || fontFamily, fontSize: `${fontSize * 1.5}px`, cursor: 'move' }}
          >
            {centerText}
          </text>
        </g>

        {(centerSubText || showDateLine) && (
          <text 
            x={cx + (centerSubXOffset || 0)} 
            y={cy + fontSize * 1.2 + (centerSubYOffset || 0)} 
            fill={finalColors.secondary} 
            textAnchor="middle" 
            onMouseDown={(e) => handleMouseDown(e, 'centerSub')}
            style={{ ...textBaseStyle, fontFamily: centerSubFontFamily || fontFamily, fontSize: `${fontSize}px`, cursor: 'move' }}
          >
            {centerSubText || 'DATE: ........................'}
          </text>
        )}

        {showSignatureLine && (
          <g>
            {showEmbeddedSignature && embeddedSignatureUrl && (
              <image 
                href={embeddedSignatureUrl} 
                x={cx - (fontSize * 3.5)} 
                y={cy + rh/2 - 90} 
                width={fontSize * 7} 
                height={fontSize * 3.5} 
                style={{ opacity: 0.85, filter: "grayscale(1) contrast(1.2)" }} 
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
            fill={finalColors.border} 
            textAnchor="middle" 
            onMouseDown={(e) => handleMouseDown(e, 'innerBottom')}
            style={{ ...textBaseStyle, fontFamily: innerBottomFontFamily || fontFamily, fontSize: `${fontSize * 0.55}px`, fontWeight: 'normal', cursor: 'move' }}
          >
            {innerBottomText}
          </text>
        )}

        <text 
          x={cx + (secondaryXOffset || 0)} 
          y={cy + rh/2 - 25 + (secondaryYOffset || 0)} 
          fill={finalColors.border} 
          textAnchor="middle" 
          onMouseDown={(e) => handleMouseDown(e, 'secondary')}
          style={{ ...textBaseStyle, fontFamily: secondaryFontFamily || fontFamily, fontSize: `${fontSize * 0.6}px`, fontWeight: 'normal', cursor: 'move' }}
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
          <image 
            key={el.id}
            href={el.content}
            x={el.x}
            y={el.y}
            width={el.width || 50}
            height={el.height || 50}
            transform={`rotate(${el.rotation || 0}, ${el.x + (el.width || 50)/2}, ${el.y + (el.height || 50)/2}) scale(${el.scale || 1})`}
            style={{ 
              filter: el.isBlackAndWhite 
                ? `grayscale(1) contrast(${el.contrast || 1.5}) ${wetInk ? "url(#wetInkFilter)" : "url(#distressFilter)"}` 
                : `contrast(${el.contrast || 1}) ${wetInk ? "url(#wetInkFilter)" : "url(#distressFilter)"}` 
            }}
          />
        );
      }
      return (
        <text
          key={el.id}
          x={el.x}
          y={el.y}
          fill={finalColors.border}
          onMouseDown={(e) => handleMouseDown(e, 'custom', el.id)}
          style={{ 
            fontFamily: el.fontFamily || fontFamily, 
            fontSize: `${fontSize * (el.scale || 1)}px`, 
            fontWeight: 'bold',
            filter: wetInk ? "url(#wetInkFilter)" : "url(#distressFilter)",
            cursor: 'move'
          }}
          transform={`rotate(${el.rotation || 0}, ${el.x}, ${el.y})`}
        >
          {el.content}
        </text>
      );
    });
  };

  const getBgClass = () => {
    switch (previewBg) {
      case 'transparent': return 'bg-transparent';
      case 'white': return 'bg-white';
      case 'paper': return 'bg-[#fdfbf7]';
      default: return 'bg-slate-50 dark:bg-slate-800/50';
    }
  };

  return (
    <div className={`relative flex items-center justify-center p-4 rounded-lg overflow-hidden ${getBgClass()} ${className}`}>
        <svg
          ref={ref}
          viewBox={viewBox}
          className="w-full h-full max-w-[500px] transition-all duration-300 drop-shadow-sm"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
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
          <g transform={`translate(${cx}, ${cy}) scale(${stretchX || 1}, ${stretchY || 1}) translate(${-cx}, ${-cy})`} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            {renderShape()}
            {renderText()}
            {renderCustomElements()}
            {statusText && (
              <text
                x={statusX || cx}
                y={statusY || cy}
                fill={finalColors.border}
                onMouseDown={(e) => handleMouseDown(e, 'status')}
                style={{
                  fontFamily: statusFontFamily || fontFamily,
                  fontSize: `${statusFontSize || 40}px`,
                  fontWeight: 'black',
                  textTransform: 'uppercase',
                  opacity: 0.4,
                  cursor: 'move',
                  fontStyle: 'italic',
                  filter: wetInk ? "url(#wetInkFilter)" : "url(#distressFilter)"
                }}
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${statusRotation || -15}, ${statusX || cx}, ${statusY || cy})`}
              >
                {statusText}
              </text>
            )}
          </g>
        </svg>
        {/* Ink Texture Overlay */}
        <div className={`absolute inset-0 pointer-events-none mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] transition-opacity ${isVintage || wetInk ? 'opacity-20' : 'opacity-5'}`}></div>
    </div>
  );
});

export default SVGPreview;
