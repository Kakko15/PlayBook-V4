import { useState } from 'react';
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
});

const gameOptions = {
  basketball: { label: 'Basketball', icon: '/images/basketball_logo.png' },
  valorant: { label: 'Valorant', icon: '/images/valorant_logo.png' },
  mlbb: { label: 'Mobile Legends', icon: '/images/ml_logo.png' },
};

const CreateTournamentModal = ({ isOpen, onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      game: undefined,
    },
  });

  const onSubmit = async (values) => {
    setIsLoading(true);
    try {
      await api.createTournament(values);
      toast.success('Tournament created successfully!');
      onSuccess();
      form.reset();
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to create tournament.'
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
          <DialogTitle>Create New Tournament</DialogTitle>
          <DialogDescription>
            Fill in the details for your new tournament. You can add more
            details later.
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
                      <SelectItem value='valorant'>
                        <div className='flex items-center gap-3'>
                          <img
                            src='/images/valorant_logo.png'
                            alt='Valorant'
                            className='h-6 w-6'
                          />
                          <span>Valorant</span>
                        </div>
                      </SelectItem>
                      <SelectItem value='mlbb'>
                        <div className='flex items-center gap-3'>
                          <img
                            src='/images/ml_logo.png'
                            alt='Mobile Legends'
                            className='h-6 w-6'
                          />
                          <span>Mobile Legends</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                {isLoading ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTournamentModal;
