import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';

const TeamDisplay = ({ team, score, isWinner }) => (
  <div
    className={cn(
      'flex h-10 items-center justify-between rounded-md border-b border-border bg-card px-3 py-2',
      isWinner
        ? 'font-bold text-foreground'
        : 'text-muted-foreground opacity-70'
    )}
  >
    <div className='flex items-center gap-2 truncate'>
      <img
        src={
          team?.logo_url ||
          `https://avatar.vercel.sh/${team?.name || 'TBD'}.png`
        }
        alt={team?.name || 'TBD'}
        className='h-5 w-5 rounded-full bg-muted'
        onError={(e) => {
          e.currentTarget.src = `https://avatar.vercel.sh/${team?.name || 'TBD'}.png`;
        }}
      />
      <span className='truncate'>{team?.name || 'TBD'}</span>
    </div>
    <span className={cn(isWinner ? 'font-bold' : 'font-medium')}>
      {score ?? '-'}
    </span>
  </div>
);

const MatchCard = ({ match, allMatches, onLogResult, isAdmin }) => {
  if (!match) return null;

  const isCompleted = match.status === 'completed';
  const team1Win = match.team1_score > match.team2_score;
  const team2Win = match.team2_score > match.team1_score;

  const feederMatch1 = allMatches.find(
    (m) => m.next_match_id === match.id && m.winner_advances_to_slot === 'team1'
  );
  const feederMatch2 = allMatches.find(
    (m) => m.next_match_id === match.id && m.winner_advances_to_slot === 'team2'
  );

  return (
    <div className='flex items-center'>
      <div className='flex w-64 flex-col gap-4'>
        {feederMatch1 ? (
          <MatchCard
            match={feederMatch1}
            allMatches={allMatches}
            onLogResult={onLogResult}
            isAdmin={isAdmin}
          />
        ) : (
          <div className='h-10 w-full' />
        )}
        {feederMatch2 ? (
          <MatchCard
            match={feederMatch2}
            allMatches={allMatches}
            onLogResult={onLogResult}
            isAdmin={isAdmin}
          />
        ) : (
          <div className='h-10 w-full' />
        )}
      </div>

      <div className='relative h-full w-8'>
        <div className='absolute left-0 top-1/2 h-[calc(50%+1rem)] w-1/2 -translate-y-1/2 border-b border-r border-t border-border' />
        <div className='absolute left-1/2 top-1/4 h-[calc(50%+2rem)] w-px -translate-y-1/4 bg-border' />
      </div>

      <div className='w-64 flex-shrink-0'>
        <div className='space-y-1 rounded-lg border border-border bg-muted/30 p-2'>
          <TeamDisplay
            team={match.team1}
            score={match.team1_score}
            isWinner={team1Win}
          />
          <TeamDisplay
            team={match.team2}
            score={match.team2_score}
            isWinner={team2Win}
          />
          <div className='flex items-center justify-between pt-1'>
            <span className='px-1 text-xs text-muted-foreground'>
              {match.round_name}
            </span>
            {isAdmin && (
              <Button
                variant='ghost'
                size='sm'
                className='h-7 px-2'
                onClick={() => onLogResult(match)}
                disabled={!match.team1_id || !match.team2_id}
              >
                <Edit className='mr-1 h-3 w-3' />
                {isCompleted ? 'Edit' : 'Log'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const BracketDisplay = ({ matches, onLogResult, isAdmin = false }) => {
  const finalMatch = matches.find((m) => m.round_name === 'Finals');

  if (!finalMatch) {
    return (
      <div className='text-center text-muted-foreground'>
        Finals match not found.
      </div>
    );
  }

  return (
    <div className='flex w-full overflow-x-auto p-4'>
      <MatchCard
        match={finalMatch}
        allMatches={matches}
        onLogResult={onLogResult}
        isAdmin={isAdmin}
      />
    </div>
  );
};

export default BracketDisplay;
