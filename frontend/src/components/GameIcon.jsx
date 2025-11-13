import React from 'react';
import { cn } from '@/lib/utils';
import { ShieldQuestion } from 'lucide-react';

const gameIcons = {
  basketball: {
    src: '/images/basketball_logo.png',
    alt: 'Basketball',
    bg: 'bg-orange-100',
  },
  valorant: {
    src: '/images/valorant_logo.png',
    alt: 'Valorant',
    bg: 'bg-red-100',
  },
  mlbb: {
    src: '/images/ml_logo.png',
    alt: 'Mobile Legends',
    bg: 'bg-blue-100',
  },
};

const GameIcon = ({ game, className }) => {
  const icon = gameIcons[game];

  if (!icon) {
    return (
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full bg-muted',
          className
        )}
      >
        <ShieldQuestion className='h-5 w-5 text-muted-foreground' />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full',
        icon.bg,
        className
      )}
    >
      <img src={icon.src} alt={icon.alt} className='h-6 w-6 object-contain' />
    </div>
  );
};

export default GameIcon;
