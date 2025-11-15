import { cn } from '@/lib/utils';

const TournamentCardSkeleton = () => {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg bg-card shadow-md shadow-black/5'
      )}
    >
      <div
        className={cn(
          'relative flex h-32 items-center justify-center p-4',
          'animate-pulse bg-surface-variant'
        )}
      >
        <div className='h-16 w-16 rounded-full bg-on-surface-variant/10'></div>
      </div>

      <div className='space-y-3 p-4'>
        <div className='h-6 w-3/4 animate-pulse rounded bg-surface-variant'></div>

        <div className='flex items-center justify-between text-sm'>
          <div className='h-4 w-1/3 animate-pulse rounded bg-surface-variant'></div>
          <div className='h-5 w-1/4 animate-pulse rounded-full bg-surface-variant'></div>
        </div>

        <div className='flex items-center text-sm text-muted-foreground'>
          <div className='h-4 w-1/2 animate-pulse rounded bg-surface-variant'></div>
        </div>
      </div>
    </div>
  );
};

export default TournamentCardSkeleton;
