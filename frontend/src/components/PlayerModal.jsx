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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'];
const YEARS = ['1', '2', '3', '4', '5'];

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name is required.' }),
  student_id: z.string().min(5, { message: 'Student ID is required.' }),
  jersey: z.coerce.number().min(0).max(99).optional(),
  year_level: z.enum(YEARS, {
    required_error: 'Select year level.',
  }),
  course: z.string().min(2, { message: 'Course/Program is required.' }),
  position: z.enum(POSITIONS, {
    required_error: 'Select a primary position.',
  }),
  secondary_position: z.enum([...POSITIONS, 'none']).optional(),
});

const PlayerModal = ({ isOpen, onClose, onSuccess, teamId, player }) => {
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = !!player;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      student_id: '',
      jersey: '',
      year_level: '',
      course: '',
      position: '',
      secondary_position: 'none',
    },
  });

  // Watch the primary position to filter the secondary options
  const primaryPosition = form.watch('position');

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && player) {
        const gameData = player.game_specific_data || {};
        form.reset({
          name: player.name,
          student_id: gameData.student_id || '',
          jersey: gameData.jersey !== undefined ? gameData.jersey : '',
          year_level: gameData.year_level || '',
          course: gameData.course || '',
          position: gameData.position || '',
          secondary_position: gameData.secondary_position || 'none',
        });
      } else {
        form.reset({
          name: '',
          student_id: '',
          jersey: '',
          year_level: '',
          course: '',
          position: '',
          secondary_position: 'none',
        });
      }
    }
  }, [isOpen, isEditMode, player, form]);

  const onSubmit = async (values) => {
    setIsLoading(true);

    const gameSpecificData = {
      student_id: values.student_id,
      jersey: values.jersey !== '' ? Number(values.jersey) : null,
      year_level: values.year_level,
      course: values.course,
      position: values.position,
      secondary_position:
        values.secondary_position === 'none' ? null : values.secondary_position,
    };

    // Clean up nulls
    Object.keys(gameSpecificData).forEach(
      (key) => gameSpecificData[key] === null && delete gameSpecificData[key]
    );

    const payload = {
      name: values.name,
      game_specific_data:
        Object.keys(gameSpecificData).length > 0 ? gameSpecificData : null,
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
      <DialogContent className='sm:max-w-[500px]'>
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
            className='space-y-4 pt-2'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Player Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='e.g., "Juan Dela Cruz"'
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='student_id'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student ID No.</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='e.g. 21-12345'
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
                name='jersey'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jersey No.</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='e.g. 23'
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-3 gap-4'>
              <div className='col-span-2'>
                <FormField
                  control={form.control}
                  name='course'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course / Program</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='e.g. BS Civil Engineering'
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className='col-span-1'>
                <FormField
                  control={form.control}
                  name='year_level'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year Level</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Year' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {YEARS.map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='position'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Position</FormLabel>
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val);
                        // If primary equals secondary, reset secondary
                        if (val === form.getValues('secondary_position')) {
                          form.setValue('secondary_position', 'none');
                        }
                      }}
                      value={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select...' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {POSITIONS.map((pos) => (
                          <SelectItem key={pos} value={pos}>
                            {pos}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='secondary_position'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>2nd Position (Optional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoading || !primaryPosition}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='None' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem
                          value='none'
                          className='text-muted-foreground'
                        >
                          None
                        </SelectItem>
                        {POSITIONS.map((pos) => (
                          <SelectItem
                            key={pos}
                            value={pos}
                            disabled={pos === primaryPosition}
                            className={pos === primaryPosition ? 'hidden' : ''}
                          >
                            {pos}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className='pt-4'>
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
