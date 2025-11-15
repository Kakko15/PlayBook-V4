import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Users } from 'lucide-react';
import TeamCard from '@/components/TeamCard';
import TeamModal from '@/components/TeamModal';
import PlayerManager from './PlayerManager';
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
import { buttonVariants } from '@/components/ui/button';

const TeamsTab = ({ tournamentId }) => {
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isPlayerManagerOpen, setIsPlayerManagerOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamToDelete, setTeamToDelete] = useState(null);

  const fetchTeams = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getTeams(tournamentId);
      setTeams(data);
    } catch (error) {
      toast.error('Failed to fetch teams.');
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleAddTeamClick = () => {
    setSelectedTeam(null);
    setIsTeamModalOpen(true);
  };

  const handleEditTeamClick = (team) => {
    setSelectedTeam(team);
    setIsTeamModalOpen(true);
  };

  const handleDeleteTeamClick = (team) => {
    setTeamToDelete(team);
    setIsAlertOpen(true);
  };

  const handleManagePlayersClick = (team) => {
    setSelectedTeam(team);
    setIsPlayerManagerOpen(true);
  };

  const confirmDelete = async () => {
    if (!teamToDelete) return;
    try {
      await api.deleteTeam(teamToDelete.id);
      toast.success('Team deleted successfully.');
      fetchTeams();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete team.');
    } finally {
      setIsAlertOpen(false);
      setTeamToDelete(null);
    }
  };

  return (
    <>
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-semibold text-foreground'>
          Teams ({teams.length})
        </h2>
        <Button onClick={handleAddTeamClick}>
          <Plus className='mr-2 h-4 w-4' />
          Add Team
        </Button>
      </div>

      <div className='mt-6'>
        {isLoading ? (
          <div className='flex h-64 w-full items-center justify-center'>
            <Loader2 className='h-8 w-8 animate-spin text-primary' />
          </div>
        ) : teams.length === 0 ? (
          <div className='flex h-48 flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card'>
            <Users className='h-12 w-12 text-muted-foreground' />
            <h3 className='mt-4 text-xl font-semibold text-foreground'>
              No teams added
            </h3>
            <p className='mt-2 text-muted-foreground'>
              Click "Add Team" to start building your roster.
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
            {teams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                onEdit={handleEditTeamClick}
                onDelete={handleDeleteTeamClick}
                onManagePlayers={handleManagePlayersClick}
              />
            ))}
          </div>
        )}
      </div>

      <TeamModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        onSuccess={fetchTeams}
        tournamentId={tournamentId}
        team={selectedTeam}
      />

      <PlayerManager
        isOpen={isPlayerManagerOpen}
        onClose={() => {
          setIsPlayerManagerOpen(false);
          fetchTeams();
        }}
        team={selectedTeam}
      />

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the team "{teamToDelete?.name}" and
              all of its players. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className={buttonVariants({ variant: 'destructive' })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TeamsTab;
