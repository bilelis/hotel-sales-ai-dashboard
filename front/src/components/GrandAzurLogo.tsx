import React from 'react';

interface GrandAzurLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
  iconOnly?: boolean;
}

export const GrandAzurLogo: React.FC<GrandAzurLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
  iconOnly = false,
}) => {
  const iconDimensions = {
    sm: 32,
    md: 42,
    lg: 52,
  };

  const px = iconDimensions[size];

  const emblem = (
    <div className="relative flex-none group">
      <svg
        width={px}
        height={px}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="filter drop-shadow-[0_2px_10px_rgba(245,158,11,0.22)] transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          {/* Champagne & Imperial Gold Gradient */}
          <linearGradient id="azurGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="45%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          {/* Deep Midnight Blue/Slate Gradient */}
          <linearGradient id="azurBackdropGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#090d16" />
          </linearGradient>

          {/* Mediterranean Azure Water Reflection */}
          <linearGradient id="azurWaterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>

        {/* Outer Luxury Shield Frame */}
        <rect
          x="2.5"
          y="2.5"
          width="43"
          height="43"
          rx="12"
          fill="url(#azurBackdropGrad)"
          stroke="url(#azurGoldGrad)"
          strokeWidth="1.25"
        />

        {/* 5 Luxury Stars Arc */}
        <g fill="url(#azurGoldGrad)">
          <circle cx="15.5" cy="10" r="0.9" />
          <circle cx="19.5" cy="8.8" r="1.1" />
          <circle cx="24" cy="8" r="1.3" />
          <circle cx="28.5" cy="8.8" r="1.1" />
          <circle cx="32.5" cy="10" r="0.9" />
        </g>

        {/* Palace Dome / Crown Crest */}
        <path
          d="M24 11.5L25.6 14.8L28.8 15.2L26.4 17.5L27 20.8L24 19.1L21 20.8L21.6 17.5L19.2 15.2L22.4 14.8L24 11.5Z"
          fill="url(#azurGoldGrad)"
        />

        {/* Classical Grand Azur Arched Colonnade */}
        <path
          d="M12.5 24.5C12.5 22.8 14 21.5 16.2 21.5C18.4 21.5 19.9 22.8 19.9 24.5V32H12.5V24.5Z"
          stroke="url(#azurGoldGrad)"
          strokeWidth="1.2"
          fill="none"
        />
        <path
          d="M19.9 23.2C19.9 21.2 21.7 19.8 24 19.8C26.3 19.8 28.1 21.2 28.1 23.2V32H19.9V23.2Z"
          stroke="url(#azurGoldGrad)"
          strokeWidth="1.35"
          fill="none"
        />
        <path
          d="M28.1 24.5C28.1 22.8 29.6 21.5 31.8 21.5C34 21.5 35.5 22.8 35.5 24.5V32H28.1V24.5Z"
          stroke="url(#azurGoldGrad)"
          strokeWidth="1.2"
          fill="none"
        />

        {/* Grand Terrace Plinth */}
        <line x1="10" y1="32.5" x2="38" y2="32.5" stroke="url(#azurGoldGrad)" strokeWidth="1.2" />

        {/* Gentle Mediterranean Sea Ripple */}
        <path
          d="M13 36.2C16 35 18 37.5 21 36.2C24 35 26 37.5 29 36.2C32 35 34 37.5 36 36.2"
          stroke="url(#azurWaterGrad)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );

  if (iconOnly) {
    return <div className={`inline-flex items-center ${className}`}>{emblem}</div>;
  }

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {emblem}
      <div className="min-w-0">
        <h1 className="font-extrabold tracking-[0.14em] text-white uppercase text-[15px] leading-tight">
          Grand Azur
        </h1>
        <span className="text-[9.5px] font-bold tracking-[0.24em] text-amber-400 block uppercase leading-tight mt-0.5">
          Palace Resort & Spa
        </span>
        {showSubtitle && (
          <span className="text-[8.5px] font-semibold tracking-[0.15em] text-teal-400/90 uppercase block mt-1">
            Analyse & Gestion Hôtelière
          </span>
        )}
      </div>
    </div>
  );
};
