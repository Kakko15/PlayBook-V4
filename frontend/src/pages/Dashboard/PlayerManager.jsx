import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, User, Edit, Trash2 } from 'lucide-react';
import PlayerModal from '@/components/PlayerModal';
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

const PlayerManager = ({ isOpen, onClose, team }) => {
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerToDelete, setPlayerToDelete] = useState(null);

  const fetchPlayers = async () => {
    if (!team) return;
    setIsLoading(true);
    try {
      const data = await api.getPlayers(team.id);
      setPlayers(data);
    } catch (error) {
      toast.error('Failed to fetch players.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPlayers();
    }
  }, [isOpen, team]);

  const handleAddClick = () => {
    setSelectedPlayer(null);
    setIsPlayerModalOpen(true);
  };

  const handleEditClick = (player) => {
    setSelectedPlayer(player);
    setIsPlayerModalOpen(true);
  };

  const handleDeleteClick = (player) => {
    setPlayerToDelete(player);
    setIsAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!playerToDelete) return;
    try {
      await api.deletePlayer(playerToDelete.id);
      toast.success('Player deleted successfully.');
      fetchPlayers();
    } catch (error) {
      toast.error('Failed to delete player.');
    } finally {
      setIsAlertOpen(false);
      setPlayerToDelete(null);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Manage Roster: {team?.name}</DialogTitle>
          </DialogHeader>
          <div className='mt-4'>
            <div className='flex items-center justify-between'>
              <h3 className='text-lg font-medium'>
                Players ({players.length})
              </h3>
              <Button onClick={handleAddClick}>
                <Plus className='mr-2 h-4 w-4' />
                Add Player
              </Button>
            </div>

            <div className='mt-4 h-[400px] space-y-3 overflow-y-auto pr-2'>
              {isLoading ? (
                <div className='flex h-full items-center justify-center'>
                  <Loader2 className='h-8 w-8 animate-spin text-primary' />
                </div>
              ) : players.length === 0 ? (
                <div className='flex h-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-border'>
                  <User className='h-12 w-12 text-muted-foreground' />
                  <h4 className='mt-4 font-semibold'>
                    No players on this team
                  </h4>
                  <p className='text-sm text-muted-foreground'>
                    Click "Add Player" to build the roster.
                  </p>
                </div>
              ) : (
                players.map((player) => (
                  <div
                    key={player.id}
                    className='flex items-center justify-between rounded-lg border border-border p-3'
                  >
                    <div className='flex items-center gap-3'>
                      <img
                        src={`https://avatar.vercel.sh/${player.name}.png`}
                        alt={player.name}
                        className='h-10 w-10 rounded-full bg-muted'
                      />
                      <div>
                        <p className='font-semibold'>{player.name}</p>
                        {player.game_specific_data?.position && (
                          <p className='text-xs text-muted-foreground'>
                            Position: {player.game_specific_data.position}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className='flex gap-1'>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => handleEditClick(player)}
                      >
                        <Edit className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => handleDeleteClick(player)}
                      >
                        <Trash2 className='h-4 w-4 text-destructive' />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PlayerModal
        isOpen={isPlayerModalOpen}
        onClose={() => setIsPlayerModalOpen(false)}
        onSuccess={() => {
          fetchPlayers();
          // We also need to refresh the team count on the previous tab
        }}
        teamId={team?.id}
        player={selectedPlayer}
      />

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the player "{playerToDelete?.name}".
              This action cannot be undone.
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

export default PlayerManager;
