import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const PickemMatchCard = ({ match, myPick, onPickSuccess }) => {
  const [loadingPick, setLoadingPick] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const isPending = match.status === 'pending';
  const isCompleted = match.status === 'completed';

  useEffect(() => {
    if (isPending && match.team1 && match.team2) {
      api
        .getMatchPrediction(match.id)
        .then((data) => setPrediction(data))
        .catch(() => setPrediction(null));
    }
  }, [match.id, isPending, match.team1, match.team2]);

  const handlePick = async (teamId) => {
    setLoadingPick(teamId);
    try {
      const { pick } = await api.makePick(match.id, teamId);
      onPickSuccess(pick);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save pick.');
    } finally {
      setLoadingPick(null);
    }
  };

  const getPickStatusIcon = (teamId) => {
    if (!myPick || myPick.status === 'pending') return null;

    if (myPick.predicted_winner_team_id === teamId) {
      return myPick.status === 'correct' ? (
        <CheckCircle className='h-5 w-5 text-green-500' />
      ) : (
        <XCircle className='h-5 w-5 text-destructive' />
      );
    }
    return null;
  };

  const team1WinProb = prediction
    ? Math.round(prediction.team1_win_probability * 100)
    : 50;
  const team2WinProb = prediction ? 100 - team1WinProb : 50;

  return (
    <div className='rounded-lg border border-border bg-card p-4'>
      <div className='mb-3 flex items-center justify-between'>
        <span className='text-sm text-muted-foreground'>
          {match.round_name || 'Match'}
        </span>
        {isCompleted && (
          <span className='rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800'>
            Completed
          </span>
        )}
      </div>
      <div className='grid grid-cols-1 items-center gap-4 sm:grid-cols-3'>
        <TeamButton
          team={match.team1}
          score={match.team1_score}
          onClick={() => handlePick(match.team1_id)}
          isSelected={myPick?.predicted_winner_team_id === match.team1_id}
          isLoading={loadingPick === match.team1_id}
          isDisabled={!isPending || loadingPick}
          pickStatusIcon={getPickStatusIcon(match.team1_id)}
          isWinner={match.team1_score > match.team2_score}
        />

        <div className='text-center font-bold text-muted-foreground'>VS</div>

        <TeamButton
          team={match.team2}
          score={match.team2_score}
          onClick={() => handlePick(match.team2_id)}
          isSelected={myPick?.predicted_winner_team_id === match.team2_id}
          isLoading={loadingPick === match.team2_id}
          isDisabled={!isPending || loadingPick}
          pickStatusIcon={getPickStatusIcon(match.team2_id)}
          isWinner={match.team2_score > match.team1_score}
          isReversed
        />
      </div>
      {isPending && prediction && (
        <div className='mt-3 space-y-1'>
          <div className='flex justify-between text-xs'>
            <span className='font-medium text-primary'>{team1WinProb}%</span>
            <span className='font-medium text-muted-foreground'>Win %</span>
            <span className='font-medium text-primary'>{team2WinProb}%</span>
          </div>
          <Progress value={team1WinProb} />
        </div>
      )}
    </div>
  );
};

const TeamButton = ({
  team,
  score,
  onClick,
  isSelected,
  isLoading,
  isDisabled,
  pickStatusIcon,
  isWinner,
  isReversed = false,
}) => {
  return (
    <Button
      variant='outline'
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'h-auto w-full justify-between p-3 transition-all',
        isSelected && 'border-primary ring-2 ring-primary ring-offset-2',
        !isWinner && score != null && 'opacity-50'
      )}
    >
      <div
        className={cn(
          'flex flex-1 items-center gap-3',
          isReversed && 'flex-row-reverse'
        )}
      >
        <img
          src={
            team?.logo_url ||
            `https://avatar.vercel.sh/${team?.name || 'TBD'}.png`
          }
          alt={`${team?.name || 'TBD'} logo`}
          className='h-8 w-8 rounded-full bg-muted'
          onError={(e) => {
            e.currentTarget.src = `https://avatar.vercel.sh/${team?.name || 'TBD'}.png`;
          }}
        />
        <span className='truncate font-medium text-foreground'>
          {team?.name || 'TBD'}
        </span>
      </div>

      <div
        className={cn(
          'flex items-center gap-2',
          isReversed ? 'flex-row-reverse' : 'flex-row'
        )}
      >
        {pickStatusIcon}
        {score != null && <span className='text-lg font-bold'>{score}</span>}
        {isLoading && <Loader2 className='h-4 w-4 animate-spin' />}
      </div>
    </Button>
  );
};

export default PickemMatchCard;
