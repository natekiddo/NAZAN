import React from 'react';

interface BrandMarkProps {
  size?: number;
  className?: string;
}

/**
 * ProjectHub mark: a "P" with a saffron dot — the marker for
 * "this is where you stopped".
 */
export default function BrandMark({ size = 36, className }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="ProjectHub"
      className={className}
    >
      <rect width="32" height="32" rx="8" fill="#111111" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" stroke="#ffffff" strokeOpacity="0.14" />
      <path
        d="M11.2 8.7h5.9a4.3 4.3 0 0 1 0 8.6h-5.9"
        stroke="#ffffff"
        strokeWidth="3.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <rect x="9.6" y="7.1" width="3.2" height="17.8" rx="1.6" fill="#ffffff" />
      <circle cx="21.6" cy="23.1" r="2.4" fill="#ffffff" />
    </svg>
  );
}
