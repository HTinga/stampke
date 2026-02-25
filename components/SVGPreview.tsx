
import React, { forwardRef } from 'react';
import { StampConfig, StampShape, BorderStyle } from '../types';

interface SVGPreviewProps {
  config: StampConfig;
  className?: string;
}

const SVGPreview = forwardRef<SVGSVGElement, SVGPreviewProps>(({ config, className }, ref) => {
  const {
    shape,
    primaryText,
    secondaryText,
    innerTopText,
    innerBottomText,
    centerText,
    centerSubText,
    fontSize,
    borderColor,
    secondaryColor,
    borderWidth,
    borderStyle,
    fontFamily,
    showSignatureLine,
    showDateLine,
    showStars,
    distressLevel,
    isVintage,
    logoUrl
  } = config;

  // Internal coordinate system to prevent clipping
  const INTERNAL_SIZE = 600;
  const viewBox = `0 0 ${INTERNAL_SIZE} ${INTERNAL_SIZE}`;
  const cx = INTERNAL_SIZE / 2;
  const cy = INTERNAL_SIZE / 2;
  
  // Dynamic sizing based on shape to ensure containment
  const maxR = (INTERNAL_SIZE / 2) - borderWidth - 60;
  const r = shape === StampShape.OVAL ? maxR * 0.8 : maxR;

  const getFinalColors = () => {
    if (isVintage) return { border: '#111827', secondary: '#111827' };
    return { border: borderColor, secondary: secondaryColor };
  };

  const finalColors = getFinalColors();

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
      filter: "url(#distressFilter)"
    };

    switch (shape) {
      case StampShape.ROUND:
        return (
          <>
            <circle cx={cx} cy={cy} r={r} {...commonProps} />
            {borderStyle === BorderStyle.DOUBLE && (
              <circle cx={cx} cy={cy} r={r - borderWidth - 6} {...commonProps} strokeWidth={borderWidth * 0.7} />
            )}
          </>
        );
      case StampShape.OVAL:
        return (
          <>
            <ellipse cx={cx} cy={cy} rx={r * 1.25} ry={r * 0.85} {...commonProps} />
            {borderStyle === BorderStyle.DOUBLE && (
              <ellipse cx={cx} cy={cy} rx={(r * 1.25) - borderWidth - 6} ry={(r * 0.85) - borderWidth - 6} {...commonProps} strokeWidth={borderWidth * 0.7} />
            )}
          </>
        );
      case StampShape.RECTANGLE:
        const rw = INTERNAL_SIZE * 0.85;
        const rh = INTERNAL_SIZE * 0.5;
        return (
          <>
            <rect x={cx - rw/2} y={cy - rh/2} width={rw} height={rh} rx={4} {...commonProps} />
            {borderStyle === BorderStyle.DOUBLE && (
               <rect x={cx - rw/2 + 6} y={cy - rh/2 + 6} width={rw - 12} height={rh - 12} rx={2} {...commonProps} strokeWidth={borderWidth * 0.5} />
            )}
          </>
        );
      case StampShape.SQUARE:
        const sSize = r * 1.5;
        return (
          <rect x={cx - sSize / 2} y={cy - sSize / 2} width={sSize} height={sSize} rx={4} {...commonProps} />
        );
      default:
        return null;
    }
  };

  const renderText = () => {
    const textBaseStyle = { 
      fontFamily, 
      fontWeight: 'bold', 
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      filter: "url(#distressFilter)"
    };

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
          
          <text fill={finalColors.border} style={{ ...textBaseStyle, fontSize: `${fontSize}px` }}>
            <textPath xlinkHref="#pathTop" startOffset="50%" textAnchor="middle">
              {primaryText}
            </textPath>
          </text>
          <text fill={finalColors.border} style={{ ...textBaseStyle, fontSize: `${fontSize * 0.75}px` }}>
            <textPath xlinkHref="#pathBottom" startOffset="50%" textAnchor="middle" dominantBaseline="hanging">
              {secondaryText}
            </textPath>
          </text>
          
          {innerTopText && (
            <text fill={finalColors.border} style={{ ...textBaseStyle, fontSize: `${fontSize * 0.55}px`, fontWeight: 'normal' }}>
              <textPath xlinkHref="#pathInnerTop" startOffset="50%" textAnchor="middle">
                {innerTopText}
              </textPath>
            </text>
          )}
          {innerBottomText && (
            <text fill={finalColors.border} style={{ ...textBaseStyle, fontSize: `${fontSize * 0.55}px`, fontWeight: 'normal' }}>
              <textPath xlinkHref="#pathInnerBottom" startOffset="50%" textAnchor="middle" dominantBaseline="hanging">
                {innerBottomText}
              </textPath>
            </text>
          )}

          {showStars && (
            <g fill={finalColors.border}>
              <text x={cx - rx - 10} y={cy + 8} fontSize={fontSize * 0.8} textAnchor="middle">★</text>
              <text x={cx + rx + 10} y={cy + 8} fontSize={fontSize * 0.8} textAnchor="middle">★</text>
            </g>
          )}
          
          <g transform={`translate(${cx}, ${cy})`}>
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
                <text x={0} y={-fontSize * 0.8} fill={finalColors.secondary} textAnchor="middle" style={{ ...textBaseStyle, fontSize: `${fontSize * 0.7}px` }}>
                  {centerSubText || 'DATE: .................'}
                </text>
              )}
              <text x={0} y={fontSize * 0.2} fill={finalColors.secondary} textAnchor="middle" style={{ ...textBaseStyle, fontSize: `${fontSize * 1.1}px` }}>
                {centerText}
              </text>
              {!showDateLine && centerSubText && (
                <text x={0} y={fontSize * 1.1} fill={finalColors.border} textAnchor="middle" style={{ ...textBaseStyle, fontSize: `${fontSize * 0.8}px`, fontWeight: 'normal' }}>
                  {centerSubText}
                </text>
              )}
              {showSignatureLine && (
                <text x={0} y={fontSize * 2.4} fill={finalColors.border} textAnchor="middle" style={{ ...textBaseStyle, fontSize: `${fontSize * 0.5}px` }}>
                  SIGN: .................................
                </text>
              )}
            </g>
          </g>
        </g>
      );
    }

    const rh = INTERNAL_SIZE * 0.5;
    return (
      <g>
        <text x={cx} y={cy - rh/2 + 40} fill={finalColors.border} textAnchor="middle" style={{ ...textBaseStyle, fontSize: `${fontSize * 0.8}px` }}>
          {primaryText}
        </text>
        
        <g transform={`translate(${cx}, ${cy})`}>
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
          <text x={0} y={fontSize * 0.2} fill={finalColors.secondary} textAnchor="middle" style={{ ...textBaseStyle, fontSize: `${fontSize * 1.5}px` }}>
            {centerText}
          </text>
        </g>

        {(centerSubText || showDateLine) && (
          <text x={cx} y={cy + fontSize * 1.2} fill={finalColors.secondary} textAnchor="middle" style={{ ...textBaseStyle, fontSize: `${fontSize}px` }}>
            {centerSubText || 'DATE: ........................'}
          </text>
        )}

        {showSignatureLine && (
          <text x={cx} y={cy + rh/2 - 50} fill={finalColors.border} textAnchor="middle" style={{ ...textBaseStyle, fontSize: `${fontSize * 0.65}px` }}>
            SIGN: .............................................
          </text>
        )}

        <text x={cx} y={cy + rh/2 - 25} fill={finalColors.border} textAnchor="middle" style={{ ...textBaseStyle, fontSize: `${fontSize * 0.6}px`, fontWeight: 'normal' }}>
          {secondaryText}
        </text>
      </g>
    );
  };

  return (
    <div className={`relative flex items-center justify-center p-4 rounded-lg overflow-hidden ${className}`}>
        <svg
          ref={ref}
          viewBox={viewBox}
          className="w-full h-full max-w-[500px] transition-all duration-300 drop-shadow-sm"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="distressFilter" x="-20%" y="-20%" width="140%" height="140%">
              {/* FeTurbulence creates the "rustness" / ink bleed noise */}
              <feTurbulence type="fractalNoise" baseFrequency={0.05 + distressLevel * 0.5} numOctaves="3" seed="5" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale={2 + distressLevel * 15} />
              
              {/* Combine displacement with original paths */}
              <feComposite operator="in" in2="SourceGraphic" />
              
              {/* Add a slight blur to simulate ink absorption */}
              <feGaussianBlur stdDeviation={distressLevel * 1.5} />
            </filter>
          </defs>
          
          {renderShape()}
          {renderText()}
        </svg>
        {/* Ink Texture Overlay */}
        <div className={`absolute inset-0 pointer-events-none mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] transition-opacity ${isVintage ? 'opacity-20' : 'opacity-5'}`}></div>
    </div>
  );
});

export default SVGPreview;
