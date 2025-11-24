import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import SortableTable from '@/components/ui/SortableTable';

const StandingsTab = ({ tournamentId }) => {
  const [standings, setStandings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStandings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getStandings(tournamentId);
      setStandings(data);
    } catch (error) {
      toast.error('Failed to fetch standings.');
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchStandings();
  }, [fetchStandings]);

  if (isLoading) {
    return (
      <div className='flex h-64 w-full items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  const columns = [
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
      header: 'Team',
      sortable: true,
      filterable: true,
      renderCell: (row) => (
        <div className='flex items-center gap-3'>
          <img
            src={row.logo_url || `https://avatar.vercel.sh/${row.name}.png`}
            alt={`${row.name} logo`}
            className='h-8 w-8 rounded-full bg-muted'
            onError={(e) => {
              e.currentTarget.src = `https://avatar.vercel.sh/${row.name}.png`;
            }}
          />
          <span className='font-medium text-foreground'>{row.name}</span>
        </div>
      ),
    },
    {
      key: 'wl',
      header: 'W-L',
      sortable: true,
      renderCell: (row) => (
        <span className='text-muted-foreground'>
          {row.wins} - {row.losses}
        </span>
      ),
    },
    {
      key: 'elo_rating',
      header: 'ELO',
      sortable: true,
      renderCell: (row) => (
        <span className='text-muted-foreground'>{row.elo_rating}</span>
      ),
    },
  ];

  return (
    <SortableTable
      data={standings}
      columns={columns}
      defaultSortKey='elo_rating'
      defaultSortOrder='desc'
      emptyMessage='No standings available'
    />
  );
};

export default StandingsTab;
