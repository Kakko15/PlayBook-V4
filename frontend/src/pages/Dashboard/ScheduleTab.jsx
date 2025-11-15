import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, CalendarDays, Edit } from 'lucide-react';
import Icon from '@/components/Icon';
import { cn } from '@/lib/utils';
import LogMatchModal from '@/components/LogMatchModal';

const ScheduleTab = ({ tournamentId, game }) => {
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchSchedule = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getSchedule(tournamentId);
      setMatches(data);
    } catch (error) {
      toast.error('Failed to fetch schedule.');
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const handleGenerateSchedule = async () => {
    setIsGenerating(true);
    try {
      await api.generateSchedule(tournamentId);
      toast.success('Schedule generated successfully!');
      fetchSchedule();
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to generate schedule.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLogResultClick = (match) => {
    setSelectedMatch(match);
    setIsModalOpen(true);
  };

  const onModalClose = () => {
    setIsModalOpen(false);
    setSelectedMatch(null);
  };

  const onModalSuccess = () => {
    onModalClose();
    fetchSchedule();
  };

  if (isLoading) {
    return (
      <div className='flex h-64 w-full items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className='flex h-48 flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card'>
        <CalendarDays className='h-12 w-12 text-muted-foreground' />
        <h3 className='mt-4 text-xl font-semibold text-foreground'>
          No schedule generated
        </h3>
        <p className='mt-2 text-muted-foreground'>
          Add at least 2 teams, then generate a schedule.
        </p>
        <Button
          onClick={handleGenerateSchedule}
          disabled={isGenerating}
          className='mt-4'
        >
          {isGenerating ? (
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          ) : (
            <Plus className='mr-2 h-4 w-4' />
          )}
          Generate Round Robin
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className='space-y-4'>
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            onLogResult={handleLogResultClick}
          />
        ))}
      </div>
      {selectedMatch && (
        <LogMatchModal
          isOpen={isModalOpen}
          onClose={onModalClose}
          onSuccess={onModalSuccess}
          match={selectedMatch}
          game={game}
        />
      )}
    </>
  );
};

const MatchCard = ({ match, onLogResult }) => {
  const isCompleted = match.status === 'completed';
  const team1Win = match.team1_score > match.team2_score;
  const team2Win = match.team2_score > match.team1_score;

  return (
    <div className='rounded-lg border border-border bg-card p-4 transition-all hover:shadow-sm'>
      <div className='mb-2 flex items-center justify-between'>
        <span className='text-sm text-muted-foreground'>
          {match.round_name || 'Match'}
        </span>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => onLogResult(match)}
          className='h-8 px-3'
        >
          <Edit className='mr-2 h-4 w-4' />
          {isCompleted ? 'Edit Result' : 'Log Result'}
        </Button>
      </div>
      <div className='flex items-center justify-between'>
        <TeamDisplay
          team={match.team1}
          score={match.team1_score}
          isWinner={team1Win}
        />
        <span className='mx-4 font-bold text-muted-foreground'>VS</span>
        <TeamDisplay
          team={match.team2}
          score={match.team2_score}
          isWinner={team2Win}
          isReversed
        />
      </div>
      {match.match_date && (
        <div className='mt-3 text-center text-xs text-muted-foreground'>
          {new Date(match.match_date).toLocaleString()}
        </div>
      )}
    </div>
  );
};

const TeamDisplay = ({ team, score, isWinner, isReversed = false }) => (
  <div
    className={cn(
      'flex flex-1 items-center gap-3',
      isReversed ? 'flex-row-reverse text-right' : 'text-left'
    )}
  >
    <img
      src={
        team?.logo_url || `https://avatar.vercel.sh/${team?.name || 'TBD'}.png`
      }
      alt={`${team?.name || 'TBD'} logo`}
      className='h-8 w-8 rounded-full bg-muted'
      onError={(e) => {
        e.currentTarget.src = `https://avatar.vercel.sh/${team?.name || 'TBD'}.png`;
      }}
    />
    <span
      className={cn(
        'flex-1 truncate font-medium',
        isWinner ? 'text-foreground' : 'text-muted-foreground'
      )}
    >
      {team?.name || 'TBD'}
    </span>
    {score != null && (
      <span
        className={cn(
          'text-xl font-bold',
          isWinner ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {score}
      </span>
    )}
  </div>
);

export default ScheduleTab;
