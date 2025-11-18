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
import Icon from '@/components/Icon';

const formSchema = z.object({
  department_id: z.string().min(1, {
    message: 'Please select a department.',
  }),
});

const TeamModal = ({ isOpen, onClose, onSuccess, tournamentId, team }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const isEditMode = !!team;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      department_id: '',
    },
  });

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await api.getDepartments();
        setDepartments(data);
      } catch (error) {
        toast.error('Failed to fetch departments.');
      }
    };

    if (isOpen) {
      fetchDepartments();
      if (isEditMode && team) {
        form.reset({
          department_id: team.department_id || '',
        });
      } else {
        form.reset({
          department_id: '',
        });
      }
    }
  }, [isOpen, isEditMode, team, form]);

  const onSubmit = async (values) => {
    setIsLoading(true);
    try {
      if (isEditMode) {
        await api.updateTeam(team.id, values);
        toast.success('Team updated successfully!');
      } else {
        await api.addTeam(tournamentId, values);
        toast.success('Team added successfully!');
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
            {isEditMode ? 'Edit Team' : 'Add Department Team'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the details for this team.'
              : 'Select a department to add to this tournament.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-6 pt-4'
          >
            <FormField
              control={form.control}
              name='department_id'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoading || departments.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select a department' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name} ({dept.acronym})
                        </SelectItem>
                      ))}
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
                {isLoading
                  ? isEditMode
                    ? 'Saving...'
                    : 'Adding...'
                  : isEditMode
                    ? 'Save Changes'
                    : 'Add Team'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TeamModal;
