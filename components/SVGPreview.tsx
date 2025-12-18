
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
    logoUrl,
    signatureUrl,
    includeCertificate
  } = config;

  const SIZE = 600;
  const viewBox = `0 0 ${SIZE} ${SIZE}`;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const baseR = 180; 
  const r = shape === StampShape.OVAL ? baseR : baseR + 20;

  const getFinalColors = () => {
    if (isVintage) return { border: '#000000', secondary: '#000000' };
    return { border: borderColor, secondary: secondaryColor };
  };

  const finalColors = getFinalColors();
  const getStrokeDashArray = () => {
    if (borderStyle === BorderStyle.DOTTED) return '3, 6';
    if (borderStyle === BorderStyle.DASHED) return '12, 6';
    return 'none';
  };

  const renderShape = () => {
    const commonProps = {
      fill: "none",
      stroke: finalColors.border,
      strokeWidth: borderWidth,
      strokeDasharray: getStrokeDashArray(),
      filter: distressLevel > 0 ? "url(#distressFilter)" : "none"
    };

    switch (shape) {
      case StampShape.ROUND:
        return (
          <>
            <circle cx={cx} cy={cy} r={r} {...commonProps} />
            {borderStyle === BorderStyle.DOUBLE && (
              <circle cx={cx} cy={cy} r={r - borderWidth - 8} {...commonProps} strokeWidth={borderWidth * 0.7} />
            )}
          </>
        );
      case StampShape.OVAL:
        return (
          <>
            <ellipse cx={cx} cy={cy} rx={r * 1.35} ry={r * 0.9} {...commonProps} />
            {borderStyle === BorderStyle.DOUBLE && (
              <ellipse cx={cx} cy={cy} rx={(r * 1.35) - borderWidth - 8} ry={(r * 0.9) - borderWidth - 8} {...commonProps} strokeWidth={borderWidth * 0.7} />
            )}
          </>
        );
      case StampShape.RECTANGLE:
        const rw = 500;
        const rh = 300;
        return (
          <>
            <rect x={cx - rw/2} y={cy - rh/2} width={rw} height={rh} rx={4} {...commonProps} />
            {borderStyle === BorderStyle.DOUBLE && (
               <rect x={cx - rw/2 + 8} y={cy - rh/2 + 8} width={rw - 16} height={rh - 16} rx={2} {...commonProps} strokeWidth={borderWidth * 0.5} />
            )}
          </>
        );
      case StampShape.SQUARE:
        const sSize = 400;
        return (
          <rect x={cx - sSize/2} y={cy - sSize/2} width={sSize} height={sSize} rx={4} {...commonProps} />
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
      letterSpacing: '0.8px',
      filter: distressLevel > 0 ? "url(#distressFilter)" : "none"
    };

    if (shape === StampShape.ROUND || shape === StampShape.OVAL) {
      const rx = shape === StampShape.ROUND ? r - (fontSize * 0.7) : (r * 1.35) - (fontSize * 0.7);
      const ry = shape === StampShape.ROUND ? r - (fontSize * 0.7) : (r * 0.9) - (fontSize * 0.7);
      const irx = rx - (fontSize * 1.1);
      const iry = ry - (fontSize * 1.1);

      return (
        <g>
          <defs>
            <path id="pathTop" d={`M ${cx - rx},${cy} A ${rx},${ry} 0 1,1 ${cx + rx},${cy}`} />
            <path id="pathBottom" d={`M ${cx - rx},${cy} A ${rx},${ry} 0 1,0 ${cx + rx},${cy}`} />
            <path id="pathInnerTop" d={`M ${cx - irx},${cy} A ${irx},${iry} 0 1,1 ${cx + irx},${cy}`} />
            <path id="pathInnerBottom" d={`M ${cx - irx},${cy} A ${irx},${iry} 0 1,0 ${cx + irx},${cy}`} />
          </defs>
          
          <text fill={finalColors.border} style={{ ...textBaseStyle, fontSize: `${fontSize}px` }}>
            <textPath xlinkHref="#pathTop" startOffset="50%" textAnchor="middle">{primaryText}</textPath>
          </text>
          <text fill={finalColors.border} style={{ ...textBaseStyle, fontSize: `${fontSize * 0.7}px` }}>
            <textPath xlinkHref="#pathBottom" startOffset="50%" textAnchor="middle" dominantBaseline="hanging">{secondaryText}</textPath>
          </text>
          
          {innerTopText && (
            <text fill={finalColors.border} style={{ ...textBaseStyle, fontSize: `${fontSize * 0.5}px`, fontWeight: 'normal' }}>
              <textPath xlinkHref="#pathInnerTop" startOffset="50%" textAnchor="middle">{innerTopText}</textPath>
            </text>
          )}
          {innerBottomText && (
            <text fill={finalColors.border} style={{ ...textBaseStyle, fontSize: `${fontSize * 0.5}px`, fontWeight: 'normal' }}>
              <textPath xlinkHref="#pathInnerBottom" startOffset="50%" textAnchor="middle" dominantBaseline="hanging">{innerBottomText}</textPath>
            </text>
          )}

          {showStars && (
            <g fill={finalColors.border}>
              <text x={cx - rx - 15} y={cy + 10} fontSize={fontSize * 0.9} textAnchor="middle">★</text>
              <text x={cx + rx + 15} y={cy + 10} fontSize={fontSize * 0.9} textAnchor="middle">★</text>
            </g>
          )}
          
          <g transform={`translate(${cx}, ${cy})`}>
            {logoUrl && (
              <image href={logoUrl} x={-fontSize * 2} y={-fontSize * 4.5} width={fontSize * 4} height={fontSize * 4} style={{ opacity: 0.9, filter: `grayscale(1) contrast(10)` }} />
            )}
            <g transform={`translate(0, ${logoUrl ? fontSize * 0.5 : 0})`}>
              {showDateLine && (
                <text x={0} y={-fontSize * 0.8} fill={finalColors.secondary} textAnchor="middle" style={{ ...textBaseStyle, fontSize: `${fontSize * 0.7}px` }}>
                  {centerSubText || 'DATE: .................'}
                </text>
              )}
              <text x={0} y={fontSize * 0.2} fill={finalColors.secondary} textAnchor="middle" style={{ ...textBaseStyle, fontSize: `${fontSize * 1.2}px` }}>
                {centerText}
              </text>
              {!showDateLine && centerSubText && (
                <text x={0} y={fontSize * 1.1} fill={finalColors.border} textAnchor="middle" style={{ ...textBaseStyle, fontSize: `${fontSize * 0.75}px`, fontWeight: 'normal' }}>
                  {centerSubText}
                </text>
              )}
              {showSignatureLine && (
                <text x={0} y={fontSize * 2.5} fill={finalColors.border} textAnchor="middle" style={{ ...textBaseStyle, fontSize: `${fontSize * 0.5}px` }}>
                  SIGN: .................................
                </text>
              )}
              {signatureUrl && (
                <image href={signatureUrl} x={-fontSize * 2.5} y={fontSize * 0.5} width={fontSize * 5} height={fontSize * 3} style={{ opacity: 0.8, filter: 'contrast(1.5) brightness(0.8)' }} />
              )}
            </g>
          </g>
        </g>
      );
    }

    const rh = 300;
    return (
      <g>
        <text x={cx} y={cy - rh/2 + 50} fill={finalColors.border} textAnchor="middle" style={{ ...textBaseStyle, fontSize: `${fontSize * 0.9}px` }}>{primaryText}</text>
        <g transform={`translate(${cx}, ${cy})`}>
          {logoUrl && <image href={logoUrl} x={-fontSize * 1.5} y={-fontSize * 4.8} width={fontSize * 3} height={fontSize * 3} style={{ filter: `grayscale(1) contrast(10)` }} />}
          <text x={0} y={fontSize * 0.2} fill={finalColors.secondary} textAnchor="middle" style={{ ...textBaseStyle, fontSize: `${fontSize * 1.6}px` }}>{centerText}</text>
          {signatureUrl && <image href={signatureUrl} x={-fontSize * 3} y={-fontSize * 1.5} width={fontSize * 6} height={fontSize * 4} style={{ opacity: 0.8 }} />}
        </g>
        {(centerSubText || showDateLine) && (
          <text x={cx} y={cy + fontSize * 1.4} fill={finalColors.secondary} textAnchor="middle" style={{ ...textBaseStyle, fontSize: `${fontSize * 1.1}px` }}>{centerSubText || 'DATE: ........................'}</text>
        )}
        {showSignatureLine && <text x={cx} y={cy + rh/2 - 60} fill={finalColors.border} textAnchor="middle" style={{ ...textBaseStyle, fontSize: `${fontSize * 0.6}px` }}>SIGN: .............................................</text>}
        <text x={cx} y={cy + rh/2 - 30} fill={finalColors.border} textAnchor="middle" style={{ ...textBaseStyle, fontSize: `${fontSize * 0.65}px`, fontWeight: 'normal' }}>{secondaryText}</text>
      </g>
    );
  };

  return (
    <div className={`relative flex items-center justify-center p-4 bg-white border border-dashed border-slate-200 rounded-[32px] overflow-hidden ${className}`}>
        {includeCertificate && (
           <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-100 z-20">
             Authenticity Certificate Attached
           </div>
        )}
        <svg
          ref={ref}
          viewBox={viewBox}
          className="w-full h-full transition-all duration-300 drop-shadow-sm"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="distressFilter" x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence type="fractalNoise" baseFrequency={0.08 + distressLevel * 0.6} numOctaves="4" seed="42" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale={1 + distressLevel * 18} />
              <feComposite operator="in" in2="SourceGraphic" />
              <feGaussianBlur stdDeviation={distressLevel * 0.8} />
            </filter>
          </defs>
          {renderShape()}
          {renderText()}
        </svg>
        <div className={`absolute inset-0 pointer-events-none mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] transition-opacity ${isVintage ? 'opacity-30' : 'opacity-10'}`}></div>
    </div>
  );
});

export default SVGPreview;
