import React from 'react';

interface GoPaqLogoProps {
  variant?: 'full' | 'horizontal' | 'compact' | 'icon';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showSlogan?: boolean;
  className?: string;
  theme?: 'dark' | 'light' | 'auto';
}

export const GoPaqLogo: React.FC<GoPaqLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  showSlogan = true,
  className = '',
  theme = 'auto'
}) => {
  // Height & scale multipliers based on size
  const sizeStyles = {
    xs: { icon: 'w-6 h-6', text: 'text-base', slogan: 'text-[7px]', box: 'h-6' },
    sm: { icon: 'w-7 h-7', text: 'text-lg', slogan: 'text-[8px]', box: 'h-8' },
    md: { icon: 'w-9 h-9', text: 'text-2xl', slogan: 'text-[9px]', box: 'h-10' },
    lg: { icon: 'w-12 h-12', text: 'text-3xl', slogan: 'text-[11px]', box: 'h-14' },
    xl: { icon: 'w-16 h-16', text: 'text-5xl', slogan: 'text-xs', box: 'h-20' },
  }[size];

  // If icon-only
  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center relative ${className}`} title="GoPaq">
        <svg
          viewBox="0 0 100 100"
          className={sizeStyles.icon}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="gopaqOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FB923C" />
              <stop offset="50%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
            <linearGradient id="gopaqSilverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="60%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
            <filter id="boxShadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
            </filter>
          </defs>

          {/* Speed Streaks Left */}
          <path d="M 6 36 L 24 36 L 20 44 L 2 44 Z" fill="url(#gopaqOrangeGrad)" />
          <path d="M 0 49 L 28 49 L 24 57 L 0 57 Z" fill="url(#gopaqOrangeGrad)" />
          <path d="M 4 62 L 22 62 L 18 70 L 0 70 Z" fill="url(#gopaqOrangeGrad)" />

          {/* Isometric Parcel Box */}
          <g filter="url(#boxShadow)">
            {/* Top Face */}
            <polygon points="50,15 78,25 50,35 22,25" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
            {/* Left Face */}
            <polygon points="22,25 50,35 50,55 22,45" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />
            {/* Right Face */}
            <polygon points="50,35 78,25 78,45 50,55" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1" />
            {/* Orange Tape Band on Top */}
            <polygon points="45,17 55,20 40,31 30,28" fill="url(#gopaqOrangeGrad)" />
            {/* Orange Tape on Left Face */}
            <polygon points="30,28 40,31 40,49 30,46" fill="#EA580C" />
          </g>

          {/* Letter G shape with speed */}
          <path
            d="M 48 38 C 30 38 22 50 22 66 C 22 82 32 94 52 94 C 64 94 72 88 75 80 L 62 80 C 60 83 56 86 51 86 C 39 86 33 78 33 66 C 33 54 40 46 50 46 C 58 46 64 51 66 56 L 76 50 C 71 42 61 38 48 38 Z"
            fill="url(#gopaqOrangeGrad)"
          />
        </svg>
      </div>
    );
  }

  // Full Brand Logo with Wordmark & Slogan
  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <div className="flex items-center gap-1.5 relative">
        {/* SVG Graphic with Parcel Box + Motion Speed Streaks */}
        <div className="relative flex items-center justify-center">
          <svg
            viewBox="0 0 240 100"
            className={`${sizeStyles.box} w-auto`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Vibrant Orange Brand Gradient */}
              <linearGradient id="gpOrange" x1="0%" y1="0%" x2="100%" y2="80%">
                <stop offset="0%" stopColor="#FFA133" />
                <stop offset="35%" stopColor="#FF7A00" />
                <stop offset="85%" stopColor="#E65100" />
                <stop offset="100%" stopColor="#C84100" />
              </linearGradient>

              {/* Metallic Silver 3D Gradient */}
              <linearGradient id="gpSilver" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="25%" stopColor="#F8FAFC" />
                <stop offset="50%" stopColor="#CBD5E1" />
                <stop offset="80%" stopColor="#94A3B8" />
                <stop offset="100%" stopColor="#64748B" />
              </linearGradient>

              {/* Box Shading Gradients */}
              <linearGradient id="boxTop" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#E2E8F0" />
              </linearGradient>
              <linearGradient id="boxLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E2E8F0" />
                <stop offset="100%" stopColor="#CBD5E1" />
              </linearGradient>
              <linearGradient id="boxRight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#CBD5E1" />
                <stop offset="100%" stopColor="#94A3B8" />
              </linearGradient>
            </defs>

            {/* 3D Isometric Shipping Parcel sitting on top right */}
            <g transform="translate(118, -4)">
              {/* Top Face */}
              <polygon points="35,6 68,16 35,28 2,18" fill="url(#boxTop)" stroke="#94A3B8" strokeWidth="0.8" />
              {/* Left Face */}
              <polygon points="2,18 35,28 35,46 2,36" fill="url(#boxLeft)" stroke="#94A3B8" strokeWidth="0.8" />
              {/* Right Face */}
              <polygon points="35,28 68,16 68,34 35,46" fill="url(#boxRight)" stroke="#64748B" strokeWidth="0.8" />
              {/* Center Tape Accent (Top) */}
              <polygon points="26,8 40,12 25,24 11,20" fill="url(#gpOrange)" />
              {/* Center Tape Accent (Front Left) */}
              <polygon points="11,20 25,24 25,41 11,37" fill="#E65100" />
            </g>

            {/* Left Speed Motion Trails */}
            <g transform="translate(0, 8)">
              <polygon points="0,32 38,32 30,42 0,42" fill="url(#gpOrange)" />
              <polygon points="0,48 48,48 38,60 0,60" fill="url(#gpOrange)" />
              <polygon points="6,66 40,66 32,77 0,77" fill="url(#gpOrange)" />
            </g>

            {/* Wordmark "Go" in vibrant 3D stylized orange */}
            {/* G */}
            <path
              d="M 82 28 C 50 28 32 46 32 68 C 32 90 48 100 78 100 C 95 100 106 93 111 82 L 89 82 C 86 86 80 89 74 89 C 58 89 49 78 49 66 C 49 51 59 40 76 40 C 86 40 94 46 97 53 L 110 46 C 104 35 94 28 82 28 Z"
              fill="url(#gpOrange)"
            />
            {/* o */}
            <path
              d="M 124 44 C 107 44 94 57 94 73 C 94 89 107 100 124 100 C 141 100 154 89 154 73 C 154 57 141 44 124 44 Z M 124 88 C 114 88 107 81 107 72 C 107 63 114 56 124 56 C 134 56 141 63 141 72 C 141 81 134 88 124 88 Z"
              fill="url(#gpOrange)"
            />

            {/* Wordmark "Paq" in metallic silver with 3D bevel */}
            {/* P */}
            <path
              d="M 152 46 L 168 46 C 179 46 187 52 187 63 C 187 74 179 80 168 80 L 162 80 L 162 100 L 152 100 Z M 162 70 L 167 70 C 172 70 176 68 176 63 C 176 58 172 56 167 56 L 162 56 Z"
              fill="url(#gpSilver)"
              stroke="#94A3B8"
              strokeWidth="0.5"
            />
            {/* a */}
            <path
              d="M 197 58 C 192 58 188 61 187 66 L 195 66 C 196 64 198 63 201 63 C 204 63 206 65 206 68 L 206 70 C 196 70 186 73 186 81 C 186 87 190 91 197 91 C 202 91 205 89 207 85 L 207 90 L 216 90 L 216 68 C 216 61 210 58 197 58 Z M 197 85 C 194 85 192 83 192 80 C 192 76 197 74 206 74 L 206 78 C 205 82 201 85 197 85 Z"
              fill="url(#gpSilver)"
              stroke="#94A3B8"
              strokeWidth="0.5"
            />
            {/* q */}
            <path
              d="M 230 58 C 224 58 219 63 219 74 C 219 85 224 90 230 90 C 235 90 238 87 240 83 L 240 106 L 249 106 L 249 60 L 240 60 L 240 65 C 238 61 235 58 230 58 Z M 233 83 C 229 83 227 79 227 74 C 227 69 229 65 233 65 C 237 65 239 69 239 74 C 239 79 237 83 233 83 Z"
              fill="url(#gpSilver)"
              stroke="#94A3B8"
              strokeWidth="0.5"
            />

            {/* Bottom swoosh arc */}
            <path
              d="M 115 95 C 160 103 210 97 240 76 C 236 88 185 106 115 95 Z"
              fill="url(#gpSilver)"
              opacity="0.8"
            />
          </svg>
        </div>
      </div>

      {/* Official Tagline / Slogan: LOGÍSTICA PUERTA A PUERTA | RÁPIDO. SEGURO. CONFIABLE. */}
      {showSlogan && (
        <div className="w-full flex flex-col items-center mt-0.5 text-center">
          <span
            className={`${sizeStyles.slogan} font-black tracking-[0.22em] uppercase text-slate-500 dark:text-slate-400 font-sans block`}
          >
            LOGÍSTICA PUERTA A PUERTA
          </span>
          <div className="w-full flex items-center justify-center gap-1.5 mt-0.5">
            <span className="h-px bg-linear-to-r from-transparent via-amber-500/60 to-transparent flex-1 max-w-[20px]" />
            <span
              className={`${sizeStyles.slogan} text-[8px] font-extrabold tracking-wider text-amber-600 dark:text-amber-400 font-sans`}
            >
              RÁPIDO • SEGURO • CONFIABLE
            </span>
            <span className="h-px bg-linear-to-r from-transparent via-amber-500/60 to-transparent flex-1 max-w-[20px]" />
          </div>
        </div>
      )}
    </div>
  );
};
