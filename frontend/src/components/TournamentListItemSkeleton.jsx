import { cn } from '@/lib/utils';

const TournamentListItemSkeleton = () => {
  return (
    <div
      className={cn(
        'flex w-full items-center gap-4 rounded-lg bg-surface-variant p-4'
      )}
    >
      <div className='h-12 w-12 flex-shrink-0 animate-pulse rounded-full bg-on-surface-variant/10'></div>

      <div className='flex-1 space-y-2'>
        <div className='h-6 w-3/4 animate-pulse rounded bg-on-surface-variant/10'></div>
        <div className='flex items-center gap-4'>
          <div className='h-4 w-1/4 animate-pulse rounded bg-on-surface-variant/10'></div>
          <div className='h-4 w-1/3 animate-pulse rounded bg-on-surface-variant/10'></div>
        </div>
      </div>

      <div className='flex flex-shrink-0 items-center gap-4'>
        <div className='h-5 w-20 animate-pulse rounded-full bg-on-surface-variant/10'></div>
        <div className='h-6 w-6 animate-pulse rounded-full bg-on-surface-variant/10'></div>
      </div>
    </div>
  );
};

export default TournamentListItemSkeleton;
