import React, { useState } from 'react';
import { GoPaqLogo } from '../ui/GoPaqLogo';

type ClientAuthAvatarProps = {
  size?: 'compact' | 'large';
  className?: string;
};

/**
 * The mascot is intentionally limited to the public client authentication
 * surfaces. Internal staff and driver areas keep the official wordmark only.
 */
export const ClientAuthAvatar: React.FC<ClientAuthAvatarProps> = ({ size = 'large', className = '' }) => {
  const [hasError, setHasError] = useState(false);
  const dimensions = size === 'large' ? 'h-48 w-36 sm:h-56 sm:w-44 lg:h-72 lg:w-56' : 'h-28 w-24 sm:h-36 sm:w-28';

  return <div className={`relative inline-flex items-center justify-center ${className}`}>
    <div className="absolute inset-1 rounded-full bg-sky-400/20 blur-2xl" aria-hidden="true" />
    <div className={`relative ${dimensions}`}>
      {hasError ? <div className="flex h-full w-full items-center justify-center rounded-3xl border border-white/20 bg-white/10"><GoPaqLogo variant="icon" size={size === 'large' ? 'xl' : 'lg'} theme="dark" /></div> : <img src="/assets/brand/gopaq-mascot.png" alt="Mascota de GoPaq" className="h-full w-full object-contain drop-shadow-2xl" loading="eager" onError={() => setHasError(true)} />}
    </div>
  </div>;
};
