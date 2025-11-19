import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Icon from '@/components/Icon';

const getInitials = (name = '') => {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('');
};

const AwardCard = ({
  title,
  icon,
  colorClass,
  player,
  metric,
  value,
  isMain = false,
}) => {
  if (!player) {
    return (
      <Card className={isMain ? 'border-2 border-primary shadow-lg' : ''}>
        <CardHeader className='flex-row items-center gap-4 space-y-0'>
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${colorClass} text-white`}
          >
            <Icon name={icon} className='text-3xl' />
          </div>
          <div>
            <CardTitle>{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground'>No eligible player found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={
        isMain
          ? 'transform border-2 border-primary shadow-lg transition-transform duration-200 hover:scale-105'
          : 'transition-shadow hover:shadow-md'
      }
    >
      <CardHeader className='flex-row items-center gap-4 space-y-0'>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full ${colorClass} text-white`}
        >
          <Icon name={icon} className='text-3xl' />
        </div>
        <div>
          <CardTitle>{title}</CardTitle>
          <p className='text-sm text-muted-foreground'>
            {metric}: {value.toFixed(2)}
          </p>
        </div>
      </CardHeader>
      <CardContent className='flex items-center gap-3'>
        <Avatar className='h-12 w-12 border-2 border-background shadow-sm'>
          <AvatarImage src={`https://avatar.vercel.sh/${player.name}.png`} />
          <AvatarFallback>{getInitials(player.name)}</AvatarFallback>
        </Avatar>
        <div>
          <p className='text-lg font-bold text-foreground'>{player.name}</p>
          <p className='text-sm font-medium text-muted-foreground'>
            {player.team.name}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

const AwardsTab = ({ tournamentId }) => {
  const [winners, setWinners] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const calculateWinners = useCallback(async () => {
    setIsLoading(true);
    try {
      const players = await api.getPlayerRankings(tournamentId);

      const eligiblePlayers = players.filter((p) => {
        const teamGames = p.team.wins + p.team.losses;
        if (teamGames === 0) return false;
        return p.game_count / teamGames >= 0.6;
      });

      if (eligiblePlayers.length === 0) {
        setWinners({ mvp: null, mythical5: [] });
        return;
      }

      const sortedPlayers = [...eligiblePlayers].sort(
        (a, b) => b.isu_ps - a.isu_ps
      );

      const mvp = sortedPlayers[0];

      const mythical5 = sortedPlayers.slice(0, 5);

      setWinners({ mvp, mythical5 });
    } catch (error) {
      console.error(error);
      toast.error('Failed to calculate awards.');
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    calculateWinners();
  }, [calculateWinners]);

  if (isLoading) {
    return (
      <div className='flex h-64 w-full items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  if (!winners || !winners.mvp) {
    return (
      <div className='flex h-48 flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card'>
        <Icon name='emoji_events' className='h-12 w-12 text-muted-foreground' />
        <h3 className='mt-4 text-xl font-semibold text-foreground'>
          No Awards Calculated Yet
        </h3>
        <p className='mt-2 text-muted-foreground'>
          Play more matches to generate enough data for MVP and Mythical 5.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-10'>
      <div className='flex justify-center'>
        <div className='w-full max-w-md'>
          <h2 className='mb-6 flex items-center justify-center gap-2 text-center text-2xl font-bold text-foreground'>
            <Icon name='military_tech' className='text-yellow-500' /> Season MVP
          </h2>
          <AwardCard
            title='Most Valuable Player'
            icon='military_tech'
            colorClass='bg-yellow-500'
            player={winners.mvp}
            metric='ISU-PS'
            value={winners.mvp?.isu_ps || 0}
            isMain={true}
          />
        </div>
      </div>

      <div>
        <h2 className='mb-6 flex items-center gap-2 text-xl font-bold text-foreground'>
          <Icon name='groups' className='text-primary' /> The Mythical 5
        </h2>
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'>
          {winners.mythical5.map((player, index) => (
            <AwardCard
              key={player.id}
              title={`Mythical Selection #${index + 1}`}
              icon='star'
              colorClass='bg-blue-600'
              player={player}
              metric='ISU-PS'
              value={player.isu_ps}
            />
          ))}
          {Array.from({
            length: Math.max(0, 5 - winners.mythical5.length),
          }).map((_, i) => (
            <Card key={`empty-${i}`} className='border-dashed opacity-50'>
              <CardHeader className='flex-row items-center gap-4'>
                <div className='flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground'>
                  <Icon name='person_off' className='text-2xl' />
                </div>
                <CardTitle className='text-base'>
                  Slot #{winners.mythical5.length + i + 1}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AwardsTab;
