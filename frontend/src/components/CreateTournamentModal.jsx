import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(5, {
    message: 'Tournament name must be at least 5 characters.',
  }),
  game: z.enum(['basketball', 'valorant', 'mlbb'], {
    required_error: 'Please select a game.',
  }),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

const gameOptions = {
  basketball: { label: 'Basketball', icon: '/images/basketball_logo.png' },
  valorant: { label: 'Valorant', icon: '/images/valorant_logo.png' },
  mlbb: { label: 'Mobile Legends', icon: '/images/ml_logo.png' },
};

const CreateTournamentModal = ({ isOpen, onClose, onSuccess, tournament }) => {
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = !!tournament;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      game: 'basketball',
      start_date: '',
      end_date: '',
    },
  });

  const toInputDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && tournament) {
        form.reset({
          name: tournament.name,
          game: tournament.game,
          start_date: toInputDate(tournament.start_date),
          end_date: toInputDate(tournament.end_date),
        });
      } else {
        form.reset({
          name: '',
          game: 'basketball',
          start_date: '',
          end_date: '',
        });
      }
    }
  }, [isOpen, isEditMode, tournament, form]);

  const onSubmit = async (values) => {
    setIsLoading(true);
    try {
      if (isEditMode) {
        const payload = {
          ...values,
          game: 'basketball',
          startDate: values.start_date || null,
          endDate: values.end_date || null,
        };
        await api.updateTournament(tournament.id, payload);
        toast.success('Tournament updated successfully!');
      } else {
        const payload = {
          ...values,
          game: 'basketball',
          start_date: values.start_date || null,
          end_date: values.end_date || null,
        };
        await api.createTournament(payload);
        toast.success('Tournament created successfully!');
      }
      onSuccess();
      handleClose();
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to process tournament.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Tournament' : 'Create New Tournament'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the details for your tournament.'
              : 'Fill in the details for your new tournament. You can add more details later.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-6 pt-4'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tournament Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='e.g., "ISU Intramurals 2025"'
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='game'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Game</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        {field.value ? (
                          <div className='flex items-center gap-2'>
                            <img
                              src={gameOptions[field.value].icon}
                              alt={gameOptions[field.value].label}
                              className='h-5 w-5'
                            />
                            <span>{gameOptions[field.value].label}</span>
                          </div>
                        ) : (
                          <SelectValue placeholder='Select a game' />
                        )}
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='basketball'>
                        <div className='flex items-center gap-3'>
                          <img
                            src='/images/basketball_logo.png'
                            alt='Basketball'
                            className='h-6 w-6'
                          />
                          <span>Basketball</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='start_date'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type='date' disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='end_date'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type='date' disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isLoading}>
                {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {isLoading
                  ? isEditMode
                    ? 'Saving...'
                    : 'Creating...'
                  : isEditMode
                    ? 'Save Changes'
                    : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTournamentModal;
