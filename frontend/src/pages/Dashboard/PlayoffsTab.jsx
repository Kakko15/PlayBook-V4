import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BracketDisplay from '@/components/BracketDisplay';
import LogMatchModal from '@/components/LogMatchModal';
import Icon from '@/components/Icon';

const PlayoffsTab = ({ tournamentId, game }) => {
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchSchedule = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getSchedule(tournamentId);
      setMatches(data);
    } catch (error) {
      toast.error('Failed to load bracket data.');
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

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
      <div className='flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card'>
        <Icon name='account_tree' className='h-12 w-12 text-muted-foreground' />
        <h3 className='mt-4 text-xl font-semibold text-foreground'>
          Bracket Not Generated
        </h3>
        <p className='mt-2 text-muted-foreground'>
          Go to the <strong>Schedule</strong> tab to generate the matches first.
        </p>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-medium text-foreground'>
          Tournament Bracket
        </h3>
        <Button variant='outline' size='sm' onClick={fetchSchedule}>
          <RefreshCw className='mr-2 h-4 w-4' />
          Refresh
        </Button>
      </div>

      <div className='overflow-x-auto rounded-lg border border-border bg-card p-4 shadow-sm'>
        <BracketDisplay
          matches={matches}
          onLogResult={handleLogResultClick}
          isAdmin={true}
        />
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
    </div>
  );
};

export default PlayoffsTab;
