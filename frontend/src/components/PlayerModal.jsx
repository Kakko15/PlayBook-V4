import React, { useState, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

const isJsonString = (str) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Player name must be at least 2 characters.',
  }),
  game_specific_data: z
    .string()
    .optional()
    .refine((val) => val === '' || val === undefined || isJsonString(val), {
      message: 'Must be a valid JSON object or empty.',
    }),
});

const PlayerModal = ({ isOpen, onClose, onSuccess, teamId, player }) => {
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = !!player;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      game_specific_data: '',
    },
  });

  useEffect(() => {
    if (isEditMode && player) {
      form.reset({
        name: player.name,
        game_specific_data: player.game_specific_data
          ? JSON.stringify(player.game_specific_data, null, 2)
          : '',
      });
    } else {
      form.reset({
        name: '',
        game_specific_data: '',
      });
    }
  }, [isEditMode, player, form]);

  const onSubmit = async (values) => {
    setIsLoading(true);
    const payload = {
      name: values.name,
      game_specific_data:
        values.game_specific_data && values.game_specific_data.trim() !== ''
          ? JSON.parse(values.game_specific_data)
          : null,
    };

    try {
      if (isEditMode) {
        await api.updatePlayer(player.id, payload);
        toast.success('Player updated successfully!');
      } else {
        await api.addPlayer(teamId, payload);
        toast.success('Player added successfully!');
      }
      onSuccess();
      handleClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred.');
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
            {isEditMode ? 'Edit Player' : 'Add New Player'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the details for this player.'
              : 'Add a new player to this team.'}
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
                  <FormLabel>Player Name / IGN</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='e.g., "PlayerOne"'
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
              name='game_specific_data'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Game Specific Data (JSON)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='e.g., {"jersey": 10, "position": "PG"}'
                      className='font-mono'
                      rows={4}
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
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
                {isEditMode ? 'Save Changes' : 'Add Player'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerModal;
