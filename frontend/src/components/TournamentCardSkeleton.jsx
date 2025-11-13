import React from 'react';
import { cn } from '@/lib/utils';

const TournamentCardSkeleton = () => {
  return (
    <div
      className={cn(
        'group cursor-pointer overflow-hidden rounded-lg shadow-lg'
      )}
    >
      <div
        className={cn(
          'relative flex h-32 items-center justify-center p-4',
          'animate-pulse bg-gray-300'
        )}
      >
        <div className='h-16 w-16 rounded-full bg-gray-400/50'></div>
      </div>

      <div className='space-y-3 bg-card p-4'>
        <div className='h-6 w-3/4 animate-pulse rounded bg-gray-300'></div>

        <div className='flex items-center justify-between text-sm'>
          <div className='h-4 w-1/3 animate-pulse rounded bg-gray-300'></div>
          <div className='h-5 w-1/4 animate-pulse rounded-full bg-gray-300'></div>
        </div>

        <div className='flex items-center text-sm text-muted-foreground'>
          <div className='h-4 w-1/2 animate-pulse rounded bg-gray-300'></div>
        </div>
      </div>
    </div>
  );
};

export default TournamentCardSkeleton;
