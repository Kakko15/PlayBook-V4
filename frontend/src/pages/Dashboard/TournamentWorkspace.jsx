import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GameIcon from '@/components/GameIcon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TeamsTab from './TeamsTab';
import Icon from '@/components/Icon'; // Import our new Icon component

const TournamentWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        const data = await api.getTournamentById(id);
        setTournament(data);
      } catch (error) {
        toast.error('Failed to fetch tournament details.');
        navigate('/admin/dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    if (id) {
      fetchTournament();
    }
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='h-12 w-12 animate-spin text-primary' />
      </div>
    );
  }

  if (!tournament) {
    return null;
  }

  return (
    <motion.div
      layoutId={`tournament-card-${tournament.id}`}
      className='flex min-h-screen flex-col bg-background'
    >
      <header className='flex items-center gap-4 border-b border-border bg-card p-4'>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => navigate('/admin/dashboard')}
        >
          {/* Use Google Icon for back arrow */}
          <Icon name='arrow_back' />
        </Button>
        <GameIcon game={tournament.game} />
        <div>
          <h1 className='font-sans text-2xl font-bold text-foreground'>
            {tournament.name}
          </h1>
          <p className='text-sm text-muted-foreground'>Tournament Workspace</p>
        </div>
      </header>

      <main className='flex-1 p-4 md:p-8'>
        <Tabs defaultValue='teams' className='w-full'>
          <TabsList className='grid w-full grid-cols-1 sm:grid-cols-5'>
            {/* Update all icons to Google Material Symbols */}
            <TabsTrigger value='teams'>
              <Icon name='group' className='mr-0 h-4 w-4 sm:mr-2' />
              <span className='hidden sm:inline'>Teams</span>
            </TabsTrigger>
            <TabsTrigger value='schedule'>
              <Icon name='calendar_month' className='mr-0 h-4 w-4 sm:mr-2' />
              <span className='hidden sm:inline'>Schedule</span>
            </TabsTrigger>
            <TabsTrigger value='standings'>
              <Icon name='leaderboard' className='mr-0 h-4 w-4 sm:mr-2' />
              <span className='hidden sm:inline'>Standings</span>
            </TabsTrigger>
            <TabsTrigger value='playoffs'>
              <Icon name='emoji_events' className='mr-0 h-4 w-4 sm:mr-2' />
              <span className='hidden sm:inline'>Playoffs</span>
            </TabsTrigger>
            <TabsTrigger value='settings'>
              <Icon name='settings' className='mr-0 h-4 w-4 sm:mr-2' />
              <span className='hidden sm:inline'>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value='teams' className='mt-6'>
            <TeamsTab tournamentId={tournament.id} />
          </TabsContent>
          <TabsContent value='schedule' className='mt-6'>
            <p>Schedule tab content will go here.</p>
          </TabsContent>
          <TabsContent value='standings' className='mt-6'>
            <p>Standings tab content will go here.</p>
          </TabsContent>
          <TabsContent value='playoffs' className='mt-6'>
            <p>Playoffs tab content will go here.</p>
          </TabsContent>
          <TabsContent value='settings' className='mt-6'>
            <p>Settings tab content will go here.</p>
          </TabsContent>
        </Tabs>
      </main>
    </motion.div>
  );
};

export default TournamentWorkspace;
