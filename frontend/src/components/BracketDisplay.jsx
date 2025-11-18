import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';

const TeamDisplay = ({ team, score, isWinner }) => (
  <div
    className={cn(
      'flex h-8 items-center justify-between rounded-md px-2 transition-colors',
      isWinner
        ? 'bg-primary/10 font-bold text-primary'
        : 'text-muted-foreground'
    )}
  >
    <div className='flex items-center gap-2 overflow-hidden truncate'>
      {team ? (
        <img
          src={team.logo_url || `https://avatar.vercel.sh/${team.name}.png`}
          alt={team.name}
          className='h-4 w-4 flex-shrink-0 rounded-full bg-background object-cover'
          onError={(e) => {
            e.currentTarget.src = `https://avatar.vercel.sh/${team.name}.png`;
          }}
        />
      ) : (
        <div className='h-4 w-4 flex-shrink-0 rounded-full bg-muted' />
      )}
      <span className='truncate text-xs'>{team?.name || 'TBD'}</span>
    </div>
    <span className='ml-2 font-mono text-xs'>{score ?? '-'}</span>
  </div>
);

const MatchCard = ({ match, onLogResult, isAdmin }) => {
  const isCompleted = match.status === 'completed';
  const team1Win = match.team1_score > match.team2_score;
  const team2Win = match.team2_score > match.team1_score;

  return (
    <div className='relative w-56 flex-shrink-0'>
      <div
        className={cn(
          'relative z-10 flex flex-col gap-1 rounded-xl border bg-card p-2 shadow-sm transition-all duration-200 hover:border-primary/50 hover:shadow-md',
          isCompleted
            ? 'border-border'
            : 'border-dashed border-muted-foreground/30'
        )}
      >
        <div className='mb-1 flex items-center justify-between px-1'>
          <span className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
            {match.round_name}
          </span>
          {isAdmin && (
            <Button
              variant='ghost'
              size='icon'
              className='h-5 w-5 opacity-50 hover:opacity-100'
              onClick={() => onLogResult(match)}
            >
              <Edit className='h-3 w-3' />
            </Button>
          )}
        </div>

        <TeamDisplay
          team={match.team1}
          score={match.team1_score}
          isWinner={team1Win}
        />
        <div className='my-0.5 h-px w-full bg-border/50' />
        <TeamDisplay
          team={match.team2}
          score={match.team2_score}
          isWinner={team2Win}
        />
      </div>
    </div>
  );
};

const BracketNode = ({ match, allMatches, onLogResult, isAdmin }) => {
  if (!match) return null;

  // Find feeders
  const feeder1 = allMatches.find(
    (m) => m.next_match_id === match.id && m.winner_advances_to_slot === 'team1'
  );
  const feeder2 = allMatches.find(
    (m) => m.next_match_id === match.id && m.winner_advances_to_slot === 'team2'
  );

  const hasFeeders = feeder1 || feeder2;

  return (
    <div className='flex items-center'>
      {/* LEFT SIDE: Feeders */}
      {hasFeeders && (
        <div className='mr-8 flex flex-col justify-center'>
          {/* TOP BRANCH */}
          <div className='relative flex flex-col justify-center'>
            {feeder1 ? (
              <BracketNode
                match={feeder1}
                allMatches={allMatches}
                onLogResult={onLogResult}
                isAdmin={isAdmin}
              />
            ) : (
              // Spacer for Bye/Direct Advance to maintain tree structure
              <div className='flex h-24 w-56 items-center justify-end pr-4'>
                <span className='text-[10px] font-medium uppercase tracking-widest text-muted-foreground/40'>
                  Direct Advance
                </span>
              </div>
            )}
            {/* Connector Line Top: Goes across and down */}
            <div className='pointer-events-none absolute right-[-2rem] top-1/2 h-[calc(50%+2px)] w-8 translate-y-0 rounded-tr-xl border-r-2 border-t-2 border-border/60'></div>
          </div>

          {/* BOTTOM BRANCH */}
          <div className='relative flex flex-col justify-center'>
            {feeder2 ? (
              <BracketNode
                match={feeder2}
                allMatches={allMatches}
                onLogResult={onLogResult}
                isAdmin={isAdmin}
              />
            ) : (
              <div className='flex h-24 w-56 items-center justify-end pr-4'>
                <span className='text-[10px] font-medium uppercase tracking-widest text-muted-foreground/40'>
                  Direct Advance
                </span>
              </div>
            )}
            {/* Connector Line Bottom: Goes across and up */}
            <div className='pointer-events-none absolute bottom-1/2 right-[-2rem] h-[calc(50%+2px)] w-8 -translate-y-0 rounded-br-xl border-b-2 border-r-2 border-border/60'></div>
          </div>
        </div>
      )}

      {/* RIGHT SIDE: Match Card */}
      <div className='relative z-20'>
        {/* Horizontal Line Input into Match Card */}
        {hasFeeders && (
          <div className='absolute left-[-1rem] top-1/2 h-0.5 w-4 -translate-y-1/2 bg-border/60'></div>
        )}

        <MatchCard match={match} onLogResult={onLogResult} isAdmin={isAdmin} />
      </div>
    </div>
  );
};

const BracketDisplay = ({ matches, onLogResult, isAdmin = false }) => {
  // Find the final match (root)
  const finalMatch =
    matches.find((m) => m.round_name === 'Finals') ||
    matches[matches.length - 1];

  if (!finalMatch) {
    return (
      <div className='flex h-64 items-center justify-center text-muted-foreground'>
        No matches found.
      </div>
    );
  }

  return (
    <div className='w-full overflow-auto rounded-xl border border-outline-variant/50 bg-surface-variant/5 p-12'>
      <div className='flex min-w-max justify-end'>
        <BracketNode
          match={finalMatch}
          allMatches={matches}
          onLogResult={onLogResult}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
};

export default BracketDisplay;
