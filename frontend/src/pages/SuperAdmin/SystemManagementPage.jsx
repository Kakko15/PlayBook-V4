import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Icon from '@/components/Icon';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const SystemManagementPage = () => {
  const [backups, setBackups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [backupToRestore, setBackupToRestore] = useState(null);

  const [isTrainingArchetypes, setIsTrainingArchetypes] = useState(false);
  const [isTrainingPredictor, setIsTrainingPredictor] = useState(false);
  const [selectedGame, setSelectedGame] = useState('');

  const fetchBackups = async () => {
    setIsLoading(true);
    try {
      const data = await api.getBackups();
      setBackups(data);
    } catch (error) {
      toast.error('Failed to fetch backups.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    setIsCreating(true);
    try {
      const { message } = await api.createBackup();
      toast.success(message);
      fetchBackups();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create backup.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestoreClick = (backup) => {
    setBackupToRestore(backup);
    setIsAlertOpen(true);
  };

  const confirmRestore = async () => {
    if (!backupToRestore) return;
    setIsRestoring(backupToRestore.id);
    setIsAlertOpen(false);
    try {
      const { message } = await api.restoreBackup(backupToRestore.storage_path);
      toast.success(message);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to restore backup.');
    } finally {
      setIsRestoring(null);
      setBackupToRestore(null);
    }
  };

  const handleTrainArchetypes = async () => {
    if (!selectedGame) {
      toast.error('Please select a game to train.');
      return;
    }
    setIsTrainingArchetypes(true);
    try {
      const { message } = await api.trainArchetypeModel(selectedGame);
      toast.success(message);
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to train archetype model.'
      );
    } finally {
      setIsTrainingArchetypes(false);
    }
  };

  const handleTrainPredictor = async () => {
    setIsTrainingPredictor(true);
    try {
      const defaultCoefficients = {
        intercept: 0.0,
        elo_diff: 0.005,
        win_streak_diff: 0.0,
      };
      const { message } = await api.trainWinPredictor(defaultCoefficients);
      toast.success(message);
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to train win predictor.'
      );
    } finally {
      setIsTrainingPredictor(false);
    }
  };

  return (
    <>
      <div className='p-8'>
        <h1 className='text-3xl font-bold text-foreground'>
          System Management
        </h1>
        <p className='mt-2 text-muted-foreground'>
          Manage database backups and data science models.
        </p>

        <div className='mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2'>
          <div className='rounded-lg border border-border bg-card p-6'>
            <div className='flex items-center justify-between'>
              <h2 className='text-xl font-semibold text-foreground'>
                Database Backups
              </h2>
              <Button onClick={handleCreateBackup} disabled={isCreating}>
                {isCreating ? (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <Icon name='add' className='mr-2' />
                )}
                Create New Backup
              </Button>
            </div>
            <div className='mt-6 space-y-3'>
              {isLoading ? (
                <div className='flex h-32 items-center justify-center'>
                  <Loader2 className='h-8 w-8 animate-spin text-primary' />
                </div>
              ) : backups.length === 0 ? (
                <p className='text-center text-muted-foreground'>
                  No backups found.
                </p>
              ) : (
                backups.map((backup) => (
                  <div
                    key={backup.id}
                    className='flex items-center justify-between rounded-lg border border-border p-4'
                  >
                    <div>
                      <p className='font-medium text-foreground'>
                        {backup.file_name}
                      </p>
                      <p className='text-sm text-muted-foreground'>
                        Created on:{' '}
                        {new Date(backup.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleRestoreClick(backup)}
                      disabled={isRestoring === backup.id}
                    >
                      {isRestoring === backup.id ? (
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      ) : (
                        <Icon name='restore' className='mr-2' />
                      )}
                      Restore
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className='rounded-lg border border-border bg-card p-6'>
            <h2 className='text-xl font-semibold text-foreground'>
              Data Science Models
            </h2>
            <div className='mt-6 space-y-4'>
              <div className='space-y-2'>
                <Label>Train Player Archetypes (K-Means Mock)</Label>
                <div className='flex gap-2'>
                  <Select onValueChange={setSelectedGame} value={selectedGame}>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Select a game' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='basketball'>Basketball</SelectItem>
                      <SelectItem value='valorant'>Valorant</SelectItem>
                      <SelectItem value='mlbb'>Mobile Legends</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleTrainArchetypes}
                    disabled={isTrainingArchetypes || !selectedGame}
                    className='flex-shrink-0'
                  >
                    {isTrainingArchetypes ? (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    ) : (
                      <Icon name='model_training' className='mr-2' />
                    )}
                    Train
                  </Button>
                </div>
                <p className='text-xs text-muted-foreground'>
                  This processes player stats to assign archetypes (e.g.,
                  "Scorer") and calculates stat vectors for KNN.
                </p>
              </div>

              <div className='space-y-2'>
                <Label>Train Win Predictor (Logistic Regression)</Label>
                <Button
                  onClick={handleTrainPredictor}
                  disabled={isTrainingPredictor}
                  className='w-full'
                  variant='outline'
                >
                  {isTrainingPredictor ? (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  ) : (
                    <Icon name='model_training' className='mr-2' />
                  )}
                  Save/Update Model Coefficients
                </Button>
                <p className='text-xs text-muted-foreground'>
                  Saves the (mock) coefficients for the match win predictor
                  model.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently overwrite the
              current database with the data from{' '}
              <span className='font-bold'>{backupToRestore?.file_name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRestore}
              className={buttonVariants({ variant: 'destructive' })}
            >
              Yes, Restore Database
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SystemManagementPage;
