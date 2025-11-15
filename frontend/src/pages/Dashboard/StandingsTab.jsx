import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

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

  return (
    <div className='overflow-x-auto rounded-lg border border-border'>
      <table className='w-full'>
        <thead className='bg-surface-variant'>
          <tr>
            <th className='px-4 py-3 text-left font-medium text-on-surface-variant'>
              Rank
            </th>
            <th className='px-4 py-3 text-left font-medium text-on-surface-variant'>
              Team
            </th>
            <th className='px-4 py-3 text-left font-medium text-on-surface-variant'>
              W-L
            </th>
            <th className='px-4 py-3 text-left font-medium text-on-surface-variant'>
              ELO
            </th>
          </tr>
        </thead>
        <tbody>
          {standings.map((team, index) => (
            <tr
              key={team.id}
              className='border-b border-border last:border-b-0 hover:bg-muted/50'
            >
              <td className='px-4 py-3 font-medium text-foreground'>
                {index + 1}
              </td>
              <td className='flex items-center gap-3 px-4 py-3'>
                <img
                  src={
                    team.logo_url || `https://avatar.vercel.sh/${team.name}.png`
                  }
                  alt={`${team.name} logo`}
                  className='h-8 w-8 rounded-full bg-muted'
                  onError={(e) => {
                    e.currentTarget.src = `https://avatar.vercel.sh/${team.name}.png`;
                  }}
                />
                <span className='font-medium text-foreground'>{team.name}</span>
              </td>
              <td className='px-4 py-3 text-muted-foreground'>
                {team.wins} - {team.losses}
              </td>
              <td className='px-4 py-3 text-muted-foreground'>
                {team.elo_rating}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StandingsTab;
