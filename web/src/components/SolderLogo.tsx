import React from 'react';

interface SolderLogoProps {
  className?: string;
  size?: number;
}

/**
 * Mark 06: "Case and joint"
 * Isometric enclosure with centered joint pad
 */
export const SolderLogo: React.FC<SolderLogoProps> = ({
  className = 'w-5 h-5',
  size = 20,
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="currentColor"
    aria-hidden="true"
    className={`shrink-0 ${className}`}
  >
    <polygon points="12.0,4.5 19.5,8.2 12.0,11.7 4.5,8.2" />
    <polygon points="4.18,8.79 11.38,12.73 11.62,20.41 4.43,16.29" />
    <polygon points="19.82,8.79 19.57,16.29 12.38,20.41 12.62,12.73" />
    <circle cx="12" cy="12.4" r="3.35" />
  </svg>
);

export const SolderWordmark: React.FC<{ className?: string }> = ({
  className = '',
}) => (
  <div className={`flex items-center gap-2 font-semibold tracking-tight text-white select-none ${className}`}>
    <SolderLogo className="w-4 h-4 text-white" />
    <span className="text-[15px] font-medium tracking-tight text-[#f5f5f5]">Solder</span>
  </div>
);
