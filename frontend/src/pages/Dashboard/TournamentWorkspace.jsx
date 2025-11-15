import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GameIcon from '@/components/GameIcon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TeamsTab from './TeamsTab';
import ScheduleTab from './ScheduleTab';
import StandingsTab from './StandingsTab';
import PlayoffsTab from './PlayoffsTab';
import PickemsTab from './PickemsTab';
import Icon from '@/components/Icon';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const TournamentWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const fetchTournament = async () => {
    try {
      const data = await api.getTournamentById(id);
      setTournament(data);
    } catch (error) {
      toast.error('Failed to fetch tournament details.');
      navigate('/admin/tournaments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
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
    <>
      <motion.div
        layoutId={`tournament-card-${tournament.id}`}
        className='flex min-h-screen flex-col bg-background'
      >
        <header className='flex items-center gap-4 border-b border-border bg-card p-4'>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => navigate('/admin/tournaments')}
          >
            <Icon name='arrow_back' />
          </Button>
          <GameIcon game={tournament.game} />
          <div>
            <h1 className='font-sans text-2xl font-bold text-foreground'>
              {tournament.name}
            </h1>
            <p className='text-sm text-muted-foreground'>
              Tournament Workspace
            </p>
          </div>
        </header>

        <main className='flex-1 p-4 md:p-8'>
          <Tabs defaultValue='teams' className='w-full'>
            <TabsList className='grid w-full grid-cols-1 sm:grid-cols-6'>
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
              <TabsTrigger value='pickems'>
                <Icon name='checklist' className='mr-0 h-4 w-4 sm:mr-2' />
                <span className='hidden sm:inline'>Pick'ems</span>
              </TabsTrigger>
              <TabsTrigger
                value='settings'
                onClick={(e) => {
                  e.preventDefault();
                  setIsSettingsOpen(true);
                }}
              >
                <Icon name='settings' className='mr-0 h-4 w-4 sm:mr-2' />
                <span className='hidden sm:inline'>Settings</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value='teams' className='mt-6'>
              <TeamsTab tournamentId={tournament.id} />
            </TabsContent>
            <TabsContent value='schedule' className='mt-6'>
              <ScheduleTab
                tournamentId={tournament.id}
                game={tournament.game}
              />
            </TabsContent>
            <TabsContent value='standings' className='mt-6'>
              <StandingsTab tournamentId={tournament.id} />
            </TabsContent>
            <TabsContent value='playoffs' className='mt-6'>
              <PlayoffsTab
                tournamentId={tournament.id}
                game={tournament.game}
              />
            </TabsContent>
            <TabsContent value='pickems' className='mt-6'>
              <PickemsTab tournamentId={tournament.id} />
            </TabsContent>
          </Tabs>
        </main>
      </motion.div>
      <TournamentSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        tournament={tournament}
        onSuccess={fetchTournament}
      />
    </>
  );
};

const TournamentSettingsModal = ({
  isOpen,
  onClose,
  tournament,
  onSuccess,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isPublic, setIsPublic] = useState(tournament.registration_open);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.updateTournament(tournament.id, { registrationOpen: isPublic });
      toast.success('Settings updated!');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to update settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tournament Settings</DialogTitle>
          <DialogDescription>
            Manage settings for {tournament.name}.
          </DialogDescription>
        </DialogHeader>
        <div className='py-4'>
          <div className='flex items-center justify-between rounded-lg border p-4'>
            <div>
              <Label htmlFor='public-switch' className='font-medium'>
                Public Tournament
              </Label>
              <p className='text-sm text-muted-foreground'>
                Allow the public to view this tournament.
              </p>
            </div>
            <Switch
              id='public-switch'
              checked={isPublic}
              onCheckedChange={setIsPublic}
              disabled={isSaving}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TournamentWorkspace;
