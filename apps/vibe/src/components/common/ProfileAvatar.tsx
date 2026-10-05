import React, { useState } from 'react';
import { Loader2, User } from 'lucide-react';

export interface ProfileAvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
  className?: string;
  isLoading?: boolean;
  fallbackName?: string;
  onClick?: () => void;
}

const SIZE_CLASSES = {
  xs: 'w-6 h-6 text-[8px]',
  sm: 'w-8 h-8 text-[9px]',
  md: 'w-10 h-10 text-[10px]',
  lg: 'w-12 h-12 text-xs',
  xl: 'w-20 h-20 text-sm',
  '2xl': 'w-28 h-28 sm:w-32 sm:h-32 text-sm',
  custom: '',
};

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  src,
  alt = 'Avatar',
  size = 'md',
  className = '',
  isLoading = false,
  fallbackName,
  onClick,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const cleanSrc = src && !src.includes('unsplash.com') ? src.trim() : null;
  const isCompact = size === 'xs' || size === 'sm';
  const sizeClass = size === 'custom' ? '' : SIZE_CLASSES[size];

  // Si en cours de chargement ou pas encore d'image disponible
  const showLoading = isLoading || (!cleanSrc && !fallbackName);

  if (showLoading) {
    return (
      <div
        onClick={onClick}
        className={`rounded-full bg-zinc-900/90 border border-zinc-800 text-zinc-400 flex flex-col items-center justify-center select-none animate-pulse shrink-0 ${sizeClass} ${className}`}
        title="Chargement du profil..."
      >
        <Loader2 className={`${isCompact ? 'w-2.5 h-2.5' : 'w-4 h-4'} animate-spin text-zinc-500`} />
        {!isCompact && (
          <span className="text-[9px] font-medium text-zinc-400 mt-1 tracking-tight">Chargement...</span>
        )}
      </div>
    );
  }

  // Si aucune image après chargement mais on a un nom/pseudo -> Initiales ou icône User
  if (!cleanSrc || hasError) {
    const initial = fallbackName ? fallbackName.replace(/^@/, '').charAt(0).toUpperCase() : null;
    return (
      <div
        onClick={onClick}
        className={`rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold flex items-center justify-center select-none shrink-0 ${sizeClass} ${className}`}
        title={fallbackName ? `@${fallbackName}` : 'Profil'}
      >
        {initial ? initial : <User className={isCompact ? 'w-3 h-3 text-zinc-400' : 'w-5 h-5 text-zinc-400'} />}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`relative rounded-full overflow-hidden shrink-0 bg-zinc-900 ${sizeClass} ${className}`}
    >
      {!imageLoaded && (
        <div className="absolute inset-0 bg-zinc-900 text-zinc-400 flex flex-col items-center justify-center animate-pulse z-10">
          <Loader2 className={`${isCompact ? 'w-2.5 h-2.5' : 'w-4 h-4'} animate-spin text-zinc-500`} />
          {!isCompact && <span className="text-[9px] text-zinc-400 mt-0.5">Chargement...</span>}
        </div>
      )}
      <img
        src={cleanSrc}
        alt={alt}
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          setHasError(true);
          setImageLoaded(true);
        }}
        className={`w-full h-full object-cover transition-opacity duration-200 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};
