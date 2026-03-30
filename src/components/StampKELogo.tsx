import React from 'react';

interface StampKELogoProps {
  size?: number;
  className?: string;
  /** 'color' = multicolor rings (default), 'white' = all white, 'blue' = all #1f6feb */
  variant?: 'color' | 'white' | 'blue';
}

// Three concentric rings — like a real ink stamp viewed from above
// Ring colors: blue (#4285F4), red (#EA4335), green (#34A853) — Google/Zoho palette
export default function StampKELogo({ size = 32, className = '', variant = 'color' }: StampKELogoProps) {
  const c1 = variant === 'color' ? '#4285F4' : variant === 'white' ? 'white' : '#1f6feb';
  const c2 = variant === 'color' ? '#EA4335' : variant === 'white' ? 'white' : '#1f6feb';
  const c3 = variant === 'color' ? '#34A853' : variant === 'white' ? 'white' : '#1f6feb';
  const cx = size / 2;

  // Ring radii — proportional to size
  const r1 = size * 0.46;   // outer ring
  const r2 = size * 0.33;   // middle ring
  const r3 = size * 0.18;   // inner ring (filled dot)
  const stroke = size * 0.07;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="StampKE logo"
    >
      {/* Outer ring */}
      <circle cx={cx} cy={cx} r={r1} stroke={c1} strokeWidth={stroke} fill="none" />
      {/* Middle ring */}
      <circle cx={cx} cy={cx} r={r2} stroke={c2} strokeWidth={stroke} fill="none" />
      {/* Inner filled circle */}
      <circle cx={cx} cy={cx} r={r3} fill={c3} />
    </svg>
  );
}
