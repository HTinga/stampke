import React from 'react';

interface StampKELogoProps {
  size?: number;
  className?: string;
  variant?: 'color' | 'white' | 'blue';
}

/**
 * StampKE Logo — clean, DocuSign-inspired mark
 * Blue rounded square with a bold geometric segmented "S" built from
 * five rectangular blocks. No snake-like bezier curves.
 */
export default function StampKELogo({ size = 32, className = '', variant = 'color' }: StampKELogoProps) {
  const isBare = variant === 'white';
  const bgFill  = isBare ? 'none'    : '#1a73e8';
  const bgStroke = isBare ? '#ffffff' : 'none';
  const fg = '#ffffff';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="StampKE logo"
    >
      {/* Rounded square background */}
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="7.5"
        fill={bgFill} stroke={bgStroke} strokeWidth={isBare ? '1.5' : '0'} />

      {/* Subtle inner ring — only on color/blue variant */}
      {!isBare && (
        <rect x="2.5" y="2.5" width="27" height="27" rx="5.5"
          fill="none" stroke="white" strokeWidth="0.75" opacity="0.25" />
      )}

      {/* ── Segmented "S" built from 5 clean block rectangles ── */}
      {/* Top horizontal bar */}
      <rect x="9" y="7" width="14" height="2.75" rx="1.375" fill={fg} />
      {/* Top-right vertical */}
      <rect x="20.25" y="9.5" width="2.75" height="5.75" rx="1.375" fill={fg} />
      {/* Middle horizontal bar */}
      <rect x="9" y="13.5" width="14" height="2.75" rx="1.375" fill={fg} />
      {/* Bottom-left vertical */}
      <rect x="9" y="16" width="2.75" height="5.75" rx="1.375" fill={fg} />
      {/* Bottom horizontal bar */}
      <rect x="9" y="21.75" width="14" height="2.75" rx="1.375" fill={fg} />
    </svg>
  );
}
