import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GameIcon from '@/components/GameIcon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/Icon';
import Logo from '@/components/Logo';
import BracketDisplay from '@/components/BracketDisplay';
import {
  getGameDetails,
  formatDateRange,
  getStatus,
} from '@/lib/tournamentUtils.jsx';
import { cn } from '@/lib/utils';

const PublicTournamentViewerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await api.getPublicTournamentDetails(id);
        setDetails(data);
      } catch (error) {
        toast.error('Failed to fetch tournament details.');
        navigate('/tournaments');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className='flex h-screen items-center justify-center bg-background'>
        <Loader2 className='h-12 w-12 animate-spin text-primary' />
      </div>
    );
  }

  if (!details) {
    return null;
  }

  const { tournament, teams, matches } = details;
  const gameDetails = getGameDetails(tournament.game);

  return (
    <motion.div
      layoutId={`tournament-card-${tournament.id}`}
      className='flex min-h-screen flex-col bg-background'
    >
      <header className='flex items-center gap-4 border-b border-border bg-card p-4'>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => navigate('/tournaments')}
        >
          <Icon name='arrow_back' />
        </Button>
        <GameIcon game={tournament.game} />
        <div>
          <h1 className='font-sans text-2xl font-bold text-foreground'>
            {tournament.name}
          </h1>
          <p className='text-sm text-muted-foreground'>Public Viewer</p>
        </div>
      </header>

      <main className='flex-1 p-4 md:p-8'>
        <Tabs defaultValue='standings' className='w-full'>
          <TabsList className='grid w-full grid-cols-1 sm:grid-cols-4'>
            <TabsTrigger value='standings'>
              <Icon name='leaderboard' className='mr-0 h-4 w-4 sm:mr-2' />
              <span className='hidden sm:inline'>Standings</span>
            </TabsTrigger>
            <TabsTrigger value='schedule'>
              <Icon name='calendar_month' className='mr-0 h-4 w-4 sm:mr-2' />
              <span className='hidden sm:inline'>Schedule</span>
            </TabsTrigger>
            <TabsTrigger value='teams'>
              <Icon name='group' className='mr-0 h-4 w-4 sm:mr-2' />
              <span className='hidden sm:inline'>Teams</span>
            </TabsTrigger>
            <TabsTrigger value='playoffs'>
              <Icon name='emoji_events' className='mr-0 h-4 w-4 sm:mr-2' />
              <span className='hidden sm:inline'>Playoffs</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value='standings' className='mt-6'>
            <StandingsTab teams={teams} />
          </TabsContent>
          <TabsContent value='schedule' className='mt-6'>
            <ScheduleTab matches={matches} />
          </TabsContent>
          <TabsContent value='teams' className='mt-6'>
            <TeamsTab teams={teams} />
          </TabsContent>
          <TabsContent value='playoffs' className='mt-6'>
            <div className='flex h-48 flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card'>
              <Icon
                name='emoji_events'
                className='h-12 w-12 text-muted-foreground'
              />
              <h3 className='mt-4 text-xl font-semibold text-foreground'>
                Playoffs Coming Soon
              </h3>
              <p className='mt-2 text-muted-foreground'>
                The bracket will be available once the group stage is complete.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </motion.div>
  );
};

const StandingsTab = ({ teams }) => (
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
        {teams.map((team, index) => (
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

const ScheduleTab = ({ matches }) => (
  <div className='space-y-4'>
    {matches.length === 0 ? (
      <div className='flex h-48 flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card'>
        <Icon
          name='calendar_month'
          className='h-12 w-12 text-muted-foreground'
        />
        <h3 className='mt-4 text-xl font-semibold text-foreground'>
          Schedule Not Available
        </h3>
        <p className='mt-2 text-muted-foreground'>
          The admin has not generated a schedule yet.
        </p>
      </div>
    ) : (
      matches.map((match) => <MatchCard key={match.id} match={match} />)
    )}
  </div>
);

const MatchCard = ({ match }) => {
  const isCompleted = match.status === 'completed';
  const team1Win = match.team1_score > match.team2_score;
  const team2Win = match.team2_score > match.team1_score;

  return (
    <div className='rounded-lg border border-border bg-card p-4'>
      <div className='mb-2 flex items-center justify-between'>
        <span className='text-sm text-muted-foreground'>
          {match.round_name || 'Match'}
        </span>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-xs font-medium',
            isCompleted
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          )}
        >
          {isCompleted ? 'Completed' : 'Pending'}
        </span>
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

const TeamsTab = ({ teams }) => (
  <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
    {teams.map((team) => (
      <div
        key={team.id}
        className='rounded-lg border border-border bg-card p-4'
      >
        <div className='flex items-center gap-3'>
          <img
            src={team.logo_url || `https://avatar.vercel.sh/${team.name}.png`}
            alt={`${team.name} logo`}
            className='h-10 w-10 rounded-full bg-muted'
            onError={(e) => {
              e.currentTarget.src = `https://avatar.vercel.sh/${team.name}.png`;
            }}
          />
          <div>
            <h3 className='font-semibold text-foreground'>{team.name}</h3>
            <p className='text-sm text-muted-foreground'>
              {team.players?.length || 0} players
            </p>
          </div>
        </div>
        <div className='mt-4 space-y-2'>
          {team.players.map((player) => (
            <div key={player.id} className='flex items-center gap-2'>
              <img
                src={`https://avatar.vercel.sh/${player.name}.png`}
                alt={player.name}
                className='h-6 w-6 rounded-full'
              />
              <span className='text-sm text-muted-foreground'>
                {player.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const PlayoffsTab = ({ matches }) => {
  const playoffMatches = matches.filter((m) =>
    ['Quarterfinals', 'Semifinals', 'Finals'].some((round) =>
      m.round_name?.includes(round)
    )
  );

  if (playoffMatches.length === 0) {
    return (
      <div className='flex h-48 flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card'>
        <Icon name='emoji_events' className='h-12 w-12 text-muted-foreground' />
        <h3 className='mt-4 text-xl font-semibold text-foreground'>
          Playoffs Not Started
        </h3>
        <p className='mt-2 text-muted-foreground'>
          The bracket will be available once the group stage is complete.
        </p>
      </div>
    );
  }

  return <BracketDisplay matches={playoffMatches} isAdmin={false} />;
};

export default PublicTournamentViewerPage;
