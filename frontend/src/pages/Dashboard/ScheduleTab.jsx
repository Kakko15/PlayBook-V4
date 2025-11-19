import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Button, buttonVariants } from '@/components/ui/button';
import { Loader2, CalendarDays, Edit, Trash2 } from 'lucide-react';
import Icon from '@/components/Icon';
import { cn } from '@/lib/utils';
import LogMatchModal from '@/components/LogMatchModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alertDialog';

const DEPARTMENT_COLORS = {
  CBAPA: '080e88',
  CCJE: '7d0608',
  CA: '174008',
  CED: '217580',
  COE: '4c0204',
  CCSICT: 'fda003',
  CON: 'd60685',
  SVM: '464646',
  CAS: 'dac607',
  IOF: '018d99',
  COM: '2c9103',
};

const getRoundRank = (roundName) => {
  const name = (roundName || '').toLowerCase();
  if (
    name.includes('final') &&
    !name.includes('semi') &&
    !name.includes('quarter')
  )
    return 1000;
  if (name.includes('semifinal')) return 900;
  if (name.includes('quarterfinal')) return 800;
  const match = name.match(/round\s*(\d+)/);
  if (match) return parseInt(match[1], 10);
  return 0;
};

const ScheduleTab = ({ tournamentId, game }) => {
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(null);
  const [isClearAlertOpen, setIsClearAlertOpen] = useState(false);

  const fetchSchedule = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getSchedule(tournamentId);
      const sortedData = data.sort((a, b) => {
        const rankA = getRoundRank(a.round_name);
        const rankB = getRoundRank(b.round_name);
        if (rankA !== rankB) return rankA - rankB;
        return a.id.localeCompare(b.id);
      });
      setMatches(sortedData);
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
      toast.success('Bracket generated successfully!');
      fetchSchedule();
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to generate schedule.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearClick = () => setIsClearAlertOpen(true);

  const confirmClearSchedule = async () => {
    setIsClearAlertOpen(false);
    setIsClearing(true);
    try {
      await api.clearSchedule(tournamentId);
      toast.success('Schedule cleared successfully.');
      fetchSchedule();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to clear schedule.');
    } finally {
      setIsClearing(false);
    }
  };

  const handleFinalizeMatch = async (matchId) => {
    setIsFinalizing(matchId);
    try {
      await api.finalizeMatch(matchId);
      toast.success('Match finalized and analytics updated.');
      fetchSchedule();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to finalize match.');
    } finally {
      setIsFinalizing(null);
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
          Add teams, then generate a bracket.
        </p>
        <Button
          onClick={handleGenerateSchedule}
          disabled={isGenerating}
          className='mt-4'
        >
          {isGenerating ? (
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          ) : (
            <Icon name='account_tree' className='mr-2' />
          )}
          Generate Schedule
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className='mb-6 flex items-center justify-end'>
        <Button
          variant='destructive'
          onClick={handleClearClick}
          disabled={isClearing}
          size='sm'
        >
          {isClearing ? (
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          ) : (
            <Trash2 className='mr-2 h-4 w-4' />
          )}
          Clear Schedule
        </Button>
      </div>

      <div className='space-y-4'>
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            onLogResult={handleLogResultClick}
            onFinalize={handleFinalizeMatch}
            isFinalizing={isFinalizing === match.id}
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

      <AlertDialog open={isClearAlertOpen} onOpenChange={setIsClearAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear the schedule? All matches and
              results will be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClearSchedule}
              className={buttonVariants({ variant: 'destructive' })}
            >
              Yes, Clear Schedule
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const MatchCard = ({ match, onLogResult, onFinalize, isFinalizing }) => {
  const isCompleted = match.status === 'completed';
  const team1Win = match.team1_score > match.team2_score;
  const team2Win = match.team2_score > match.team1_score;
  const isFinalized = match.is_finalized;

  return (
    <div className='rounded-lg border border-border bg-card p-4 transition-all hover:shadow-sm'>
      <div className='mb-4 flex items-center justify-between'>
        <span className='text-sm font-medium uppercase tracking-wider text-muted-foreground'>
          {match.round_name || 'Match'}
        </span>
        <div className='flex items-center gap-2'>
          {isFinalized && (
            <span className='flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800'>
              <Icon name='lock' className='mr-1 text-xs' /> Finalized
            </span>
          )}
          <Button
            variant='ghost'
            size='sm'
            onClick={() => onLogResult(match)}
            className='h-8 px-3'
            disabled={isFinalized || isFinalizing}
          >
            <Edit className='mr-2 h-4 w-4' />
            {isCompleted ? 'Edit Result' : 'Log Result'}
          </Button>
          {isCompleted && !isFinalized && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => onFinalize(match.id)}
              className='h-8 px-3'
              disabled={isFinalizing}
            >
              {isFinalizing ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Icon name='lock' className='mr-2' />
              )}
              Finalize
            </Button>
          )}
        </div>
      </div>

      <div className='mb-6 flex items-center justify-between'>
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

      <div className='flex items-center justify-center gap-6 border-t border-border pt-3 text-sm text-muted-foreground'>
        <div className='flex items-center gap-2'>
          <Icon name='calendar_today' className='text-lg text-primary/70' />
          <span>
            {match.match_date
              ? new Date(match.match_date).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })
              : 'Date TBD'}
          </span>
        </div>
        <div className='h-4 w-px bg-border'></div>
        <div className='flex items-center gap-2'>
          <Icon name='location_on' className='text-lg text-primary/70' />
          <span>{match.venue || 'Venue TBD'}</span>
        </div>
      </div>
    </div>
  );
};

const TeamDisplay = ({ team, score, isWinner, isReversed = false }) => {
  const acronym =
    team?.department?.acronym ||
    team?.name?.substring(0, 2).toUpperCase() ||
    'NA';
  const color = DEPARTMENT_COLORS[acronym] || '64748b';
  const logoSrc =
    team?.logo_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(acronym)}&background=${color}&color=fff&size=64&bold=true&length=4`;

  return (
    <div
      className={cn(
        'flex flex-1 items-center gap-4',
        isReversed ? 'flex-row-reverse text-right' : 'text-left'
      )}
    >
      <img
        src={logoSrc}
        alt={team?.name}
        className='h-12 w-12 rounded-full bg-muted object-cover shadow-sm'
        onError={(e) => {
          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(acronym)}&background=random&color=fff`;
        }}
      />
      <div className='flex min-w-0 flex-col'>
        <span
          className={cn(
            'truncate text-lg font-bold',
            isWinner ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          {team?.name || 'TBD'}
        </span>
        {team?.name && (
          <span className='text-xs font-medium text-muted-foreground'>
            {isWinner ? 'Winner' : ''}
          </span>
        )}
      </div>
      {score != null && (
        <span
          className={cn(
            'ml-auto text-3xl font-bold',
            isWinner ? 'text-primary' : 'text-muted-foreground/50',
            isReversed ? 'ml-0 mr-auto' : 'ml-auto'
          )}
        >
          {score}
        </span>
      )}
    </div>
  );
};

export default ScheduleTab;
