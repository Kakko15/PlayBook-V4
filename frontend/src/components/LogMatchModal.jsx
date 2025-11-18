import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';

const getStatSchema = (game) => {
  switch (game) {
    case 'basketball':
    default:
      return z.object({
        pts: z.coerce.number().min(0).default(0),
        reb: z.coerce.number().min(0).default(0),
        ast: z.coerce.number().min(0).default(0),
        oreb: z.coerce.number().min(0).default(0),
        dreb: z.coerce.number().min(0).default(0),
        fouls_drawn: z.coerce.number().min(0).default(0),
        games_started: z.coerce.number().min(0).max(1).default(0),
        sportsmanship_rating: z.coerce.number().min(0).max(5).default(5),
        shot_x_coord: z.coerce.number().optional(),
        shot_y_coord: z.coerce.number().optional(),
      });
  }
};

const getFormSchema = (game) =>
  z.object({
    team1_score: z.coerce.number().min(0, 'Score is required.'),
    team2_score: z.coerce.number().min(0, 'Score is required.'),
    match_date: z.string().optional(),
    round_name: z.string().optional(),
    player_stats: z.array(
      z.object({
        player_id: z.string(),
        name: z.string(),
        stats: getStatSchema(game),
      })
    ),
  });

const LogMatchModal = ({ isOpen, onClose, onSuccess, match, game }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [matchDetails, setMatchDetails] = useState(null);

  const formSchema = getFormSchema(game);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      team1_score: 0,
      team2_score: 0,
      match_date: '',
      round_name: '',
      player_stats: [],
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: 'player_stats',
  });

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await api.getMatchDetails(match.id);
        setMatchDetails(data);
        const team1Players = data.team1.players.map((p) => ({
          player_id: p.id,
          name: p.name,
          stats: {},
        }));
        const team2Players = data.team2.players.map((p) => ({
          player_id: p.id,
          name: p.name,
          stats: {},
        }));

        form.reset({
          team1_score: data.team1_score ?? 0,
          team2_score: data.team2_score ?? 0,
          match_date: data.match_date
            ? new Date(data.match_date).toISOString().slice(0, 16)
            : '',
          round_name: data.round_name ?? '',
          player_stats: [...team1Players, ...team2Players],
        });
      } catch (error) {
        toast.error('Failed to load match details.');
      }
    };

    if (match) {
      fetchDetails();
    }
  }, [match, form, game]);

  const onSubmit = async (values) => {
    setIsLoading(true);
    try {
      await api.logMatchResult(match.id, {
        ...values,
        match_date: values.match_date
          ? new Date(values.match_date).toISOString()
          : null,
      });
      toast.success('Match result saved!');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save result.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatFields = () => {
    switch (game) {
      case 'basketball':
      default:
        return [
          'pts',
          'reb',
          'ast',
          'oreb',
          'dreb',
          'fouls_drawn',
          'games_started',
          'sportsmanship_rating',
        ];
    }
  };

  const statFields = getStatFields();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-3xl'>
        <DialogHeader>
          <DialogTitle>Log Match Result</DialogTitle>
          <DialogDescription>
            {matchDetails?.team1?.name || 'Team 1'} vs.{' '}
            {matchDetails?.team2?.name || 'Team 2'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-6 pt-4'
          >
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='team1_score'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{matchDetails?.team1?.name} Score</FormLabel>
                    <FormControl>
                      <Input type='number' disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='team2_score'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{matchDetails?.team2?.name} Score</FormLabel>
                    <FormControl>
                      <Input type='number' disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='round_name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Round Name (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='e.g., Round 1'
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
                name='match_date'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Match Date (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type='datetime-local'
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='max-h-64 space-y-4 overflow-y-auto pr-2'>
              <h4 className='font-medium'>Player Stats (Optional)</h4>
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className={cn(
                    'grid grid-cols-4 items-center gap-2',
                    game === 'basketball' && 'grid-cols-5'
                  )}
                >
                  <FormLabel className='truncate'>{field.name}</FormLabel>
                  {statFields.map((statName) => (
                    <FormField
                      key={statName}
                      control={form.control}
                      name={`player_stats.${index}.stats.${statName}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type='number'
                              placeholder={statName.toUpperCase()}
                              className='h-8 py-1'
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isLoading}>
                {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Save Result
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default LogMatchModal;
