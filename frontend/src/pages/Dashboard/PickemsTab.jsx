import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import PickemMatchCard from '@/components/PickemMatchCard';
import Icon from '@/components/Icon';
import SortableTable from '@/components/ui/SortableTable';

const PickemsTab = ({ tournamentId }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [matches, setMatches] = useState([]);
  const [myPicks, setMyPicks] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [boardData, scheduleData, picksData] = await Promise.all([
        api.getPickLeaderboard(tournamentId),
        api.getSchedule(tournamentId),
        api.getMyPicks(tournamentId),
      ]);

      setLeaderboard(boardData);
      setMatches(scheduleData);

      const picksMap = picksData.reduce((acc, pick) => {
        acc[pick.match_id] = pick;
        return acc;
      }, {});
      setMyPicks(picksMap);
    } catch (error) {
      toast.error("Failed to load Pick'ems data.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePickSuccess = (pick) => {
    setMyPicks((prevPicks) => ({
      ...prevPicks,
      [pick.match_id]: pick,
    }));
    toast.success('Pick saved!');
  };

  if (isLoading) {
    return (
      <div className='flex h-64 w-full items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  const leaderboardColumns = [
    {
      key: 'rank',
      header: 'Rank',
      sortable: true,
      renderCell: (row, value, index) => (
        <span className='font-medium text-foreground'>{index + 1}</span>
      ),
    },
    {
      key: 'name',
      header: 'User',
      sortable: true,
      filterable: true,
      renderCell: (row) => (
        <span
          className={cn(
            'font-medium',
            row.user_id === user.id ? 'text-primary' : 'text-foreground'
          )}
        >
          {row.name}
        </span>
      ),
    },
    {
      key: 'correct_picks',
      header: 'Picks',
      sortable: true,
      renderCell: (row) => (
        <span className='text-muted-foreground'>{row.correct_picks}</span>
      ),
    },
    {
      key: 'total_points',
      header: 'Points',
      sortable: true,
      cellClassName: 'text-right',
      renderCell: (row) => (
        <span className='font-bold text-primary'>{row.total_points}</span>
      ),
    },
  ];

  return (
    <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
      <div className='space-y-6 lg:col-span-2'>
        <h2 className='text-2xl font-semibold text-foreground'>
          Make Your Picks
        </h2>
        <div className='space-y-4'>
          {matches.length === 0 ? (
            <div className='flex h-48 flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card'>
              <Icon
                name='checklist'
                className='h-12 w-12 text-muted-foreground'
              />
              <h3 className='mt-4 text-xl font-semibold text-foreground'>
                No Matches Available
              </h3>
              <p className='mt-2 text-muted-foreground'>
                The schedule hasn't been generated yet.
              </p>
            </div>
          ) : (
            matches.map((match) => (
              <PickemMatchCard
                key={match.id}
                match={match}
                myPick={myPicks[match.id]}
                onPickSuccess={handlePickSuccess}
              />
            ))
          )}
        </div>
      </div>

      <div className='lg:col-span-1'>
        <h2 className='mb-6 text-2xl font-semibold text-foreground'>
          Leaderboard
        </h2>
        <SortableTable
          data={leaderboard.map((entry) => ({
            ...entry,
            rowClassName:
              entry.user_id === user.id ? 'bg-primary-container' : '',
          }))}
          columns={leaderboardColumns}
          defaultSortKey='total_points'
          defaultSortOrder='desc'
          emptyMessage='No predictions made yet.'
        />
      </div>
    </div>
  );
};

export default PickemsTab;
