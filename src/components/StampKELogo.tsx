import React from 'react';

interface StampKELogoProps {
  size?: number;
  className?: string;
  variant?: 'color' | 'white' | 'blue';
}

/**
 * StampKE Logo — a premium seal/stamp mark
 * Inspired by DocuSign: clean, trustworthy, professional
 * An octagonal stamp shape with a stylized "S" pen nib inside
 */
export default function StampKELogo({ size = 32, className = '', variant = 'color' }: StampKELogoProps) {
  const primary = variant === 'color' ? '#1a73e8' : variant === 'white' ? '#ffffff' : '#1a73e8';
  const accent  = variant === 'color' ? '#34a853' : variant === 'white' ? '#ffffff' : '#1a73e8';
  const bg      = variant === 'color' ? '#e8f0fe' : variant === 'white' ? 'transparent' : '#dbeafe';
  const cx = size / 2;
  const r = size * 0.44;

  // Octagon points
  const oct = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * 45 - 22.5) * Math.PI / 180;
    return `${cx + r * Math.cos(angle)},${cx + r * Math.sin(angle)}`;
  }).join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none"
      xmlns="http://www.w3.org/2000/svg" className={className} aria-label="StampKE logo">
      {/* Octagon background */}
      <polygon points={oct} fill={bg} stroke={primary} strokeWidth={size * 0.045} />
      {/* Inner smaller octagon ring */}
      {(() => {
        const r2 = r * 0.78;
        const pts = Array.from({length:8},(_,i)=>{
          const a = (i*45-22.5)*Math.PI/180;
          return `${cx+r2*Math.cos(a)},${cx+r2*Math.sin(a)}`;
        }).join(' ');
        return <polygon points={pts} fill="none" stroke={primary} strokeWidth={size*0.018} opacity="0.4"/>;
      })()}
      {/* Stylized "S" / pen nib path */}
      <path
        d={`M${cx-size*0.14},${cx-size*0.06} C${cx-size*0.14},${cx-size*0.16} ${cx+size*0.14},${cx-size*0.16} ${cx+size*0.14},${cx-size*0.06} C${cx+size*0.14},${cx+size*0.04} ${cx-size*0.14},${cx+size*0.04} ${cx-size*0.14},${cx+size*0.14} C${cx-size*0.14},${cx+size*0.22} ${cx+size*0.14},${cx+size*0.22} ${cx+size*0.14},${cx+size*0.12}`}
        stroke={primary}
        strokeWidth={size * 0.075}
        strokeLinecap="round"
        fill="none"
      />
      {/* Accent dot */}
      <circle cx={cx} cy={cx + size * 0.17} r={size * 0.045} fill={accent} />
    </svg>
  );
}
