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

const getStatSchema = (game) => {
  switch (game) {
    case 'basketball':
    default:
      return z.object({
        minutes_played: z.coerce.number().min(0).max(60).default(0),
        pts: z.coerce.number().min(0).default(0),
        fg_made: z.coerce.number().min(0).default(0),
        fg_attempted: z.coerce.number().min(0).default(0),
        three_pt_made: z.coerce.number().min(0).default(0),
        three_pt_attempted: z.coerce.number().min(0).default(0),
        ft_made: z.coerce.number().min(0).default(0),
        ft_attempted: z.coerce.number().min(0).default(0),
        reb: z.coerce.number().min(0).default(0),
        ast: z.coerce.number().min(0).default(0),
        oreb: z.coerce.number().min(0).default(0),
        dreb: z.coerce.number().min(0).default(0),
        steals: z.coerce.number().min(0).default(0),
        blocks: z.coerce.number().min(0).default(0),
        turnovers: z.coerce.number().min(0).default(0),
        personal_fouls: z.coerce.number().min(0).default(0),
        technical_fouls: z.coerce.number().min(0).default(0),
        fouls_drawn: z.coerce.number().min(0).default(0),
        games_started: z.coerce.number().min(0).max(1).default(0),
        sportsmanship_rating: z.coerce.number().min(0).max(5).default(5),
      });
  }
};

const getFormSchema = (game) =>
  z.object({
    team1_score: z.coerce.number().min(0, 'Score is required.'),
    team2_score: z.coerce.number().min(0, 'Score is required.'),
    match_date: z.string().optional(),
    round_name: z.string().optional(),
    venue: z.string().optional(),
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
      venue: '',
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
        // Note: This resets stats to 0 every time you open the modal for now.
        // To support editing existing stats, you'd need to fetch match_player_stats from API here.
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
          venue: data.venue ?? '',
          player_stats: [...team1Players, ...team2Players],
        });
      } catch (error) {
        toast.error('Failed to load match details.');
      }
    };

    if (match && isOpen) {
      fetchDetails();
    }
  }, [match, form, game, isOpen]);

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
          { key: 'minutes_played', label: 'MIN' },
          { key: 'pts', label: 'PTS' },
          { key: 'fg_made', label: 'FGM' },
          { key: 'fg_attempted', label: 'FGA' },
          { key: 'three_pt_made', label: '3PM' },
          { key: 'three_pt_attempted', label: '3PA' },
          { key: 'ft_made', label: 'FTM' },
          { key: 'ft_attempted', label: 'FTA' },
          { key: 'reb', label: 'REB' },
          { key: 'oreb', label: 'OREB' },
          { key: 'dreb', label: 'DREB' },
          { key: 'ast', label: 'AST' },
          { key: 'steals', label: 'STL' },
          { key: 'blocks', label: 'BLK' },
          { key: 'turnovers', label: 'TO' },
          { key: 'personal_fouls', label: 'PF' },
          { key: 'technical_fouls', label: 'TF' },
          { key: 'fouls_drawn', label: 'FD' },
          { key: 'games_started', label: 'GS' },
          { key: 'sportsmanship_rating', label: 'SPRT' },
        ];
    }
  };

  const statCols = getStatFields();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='flex h-[90vh] max-w-[95vw] flex-col gap-0 overflow-hidden p-0 md:max-w-[90vw] lg:max-w-7xl'>
        <DialogHeader className='flex-shrink-0 p-6 pb-2'>
          <DialogTitle>Log Match Result</DialogTitle>
          <DialogDescription>
            {matchDetails?.team1?.name || 'Team 1'} vs.{' '}
            {matchDetails?.team2?.name || 'Team 2'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex flex-1 flex-col overflow-hidden'
          >
            {/* Top Controls Section */}
            <div className='grid flex-shrink-0 grid-cols-1 gap-6 border-b bg-card p-6 pt-2 md:grid-cols-2'>
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='team1_score'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='block truncate'>
                        {matchDetails?.team1?.name} Score
                      </FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          className='text-lg font-bold'
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
                  name='team2_score'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='block truncate'>
                        {matchDetails?.team2?.name} Score
                      </FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          className='text-lg font-bold'
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
                <FormField
                  control={form.control}
                  name='round_name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Round</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Round 1'
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
                      <FormLabel>Date</FormLabel>
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
                <FormField
                  control={form.control}
                  name='venue'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Venue</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Gym'
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Scrollable Stats Table */}
            <div className='flex-1 overflow-auto bg-muted/10'>
              <div className='min-w-max'>
                {/* Table Header */}
                <div className='sticky top-0 z-10 flex items-center border-b bg-muted/50 px-4 py-2 backdrop-blur-sm'>
                  <div className='w-48 flex-shrink-0 text-sm font-semibold'>
                    Player Name
                  </div>
                  <div className='flex gap-2'>
                    {statCols.map((col) => (
                      <div
                        key={col.key}
                        className='w-16 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground'
                      >
                        {col.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Table Rows */}
                <div className='divide-y'>
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className='flex items-center px-4 py-2 transition-colors hover:bg-muted/20'
                    >
                      <div className='w-48 flex-shrink-0 truncate pr-4 text-sm font-medium'>
                        {field.name}
                        <input
                          type='hidden'
                          {...form.register(`player_stats.${index}.player_id`)}
                        />
                        <input
                          type='hidden'
                          {...form.register(`player_stats.${index}.name`)}
                        />
                      </div>
                      <div className='flex gap-2'>
                        {statCols.map((col) => (
                          <FormField
                            key={col.key}
                            control={form.control}
                            name={`player_stats.${index}.stats.${col.key}`}
                            render={({ field: inputField }) => (
                              <div className='w-16'>
                                <FormControl>
                                  <Input
                                    type='number'
                                    className='h-8 px-1 text-center text-sm'
                                    disabled={isLoading}
                                    onFocus={(e) => e.target.select()}
                                    {...inputField}
                                  />
                                </FormControl>
                              </div>
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className='flex-shrink-0 border-t bg-card p-6'>
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
                Save Match Result
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default LogMatchModal;
