import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Icon from '@/components/Icon';
import GameIcon from '@/components/GameIcon';
import { formatDateRange, getStatus } from '@/lib/tournamentUtils.jsx';

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 100 } },
};

const TournamentListItem = ({ tournament }) => {
  const navigate = useNavigate();

  if (!tournament) return null;

  const teamCount = tournament.teams?.[0]?.count || 0;
  const status = getStatus(tournament.start_date);
  const dateRange = formatDateRange(tournament.start_date, tournament.end_date);

  const handleClick = () => {
    navigate(`/admin/tournament/${tournament.id}`);
  };

  return (
    <motion.div
      layoutId={`tournament-card-${tournament.id}`}
      variants={itemVariants}
      onClick={handleClick}
      className='group flex w-full cursor-pointer items-center gap-4 rounded-lg border border-border bg-card p-4 transition-all duration-300 ease-out hover:border-primary/50 hover:shadow-lg'
    >
      <GameIcon game={tournament.game} className='h-12 w-12' />

      <div className='flex-1 truncate'>
        <h3
          className='truncate font-sans text-lg font-bold text-foreground'
          title={tournament.name}
        >
          {tournament.name}
        </h3>
        <div className='flex items-center gap-4 text-sm text-muted-foreground'>
          <span className='flex items-center'>
            <Icon name='group' className='mr-1.5 text-base' />
            {teamCount} team{teamCount !== 1 ? 's' : ''}
          </span>
          <span className='flex items-center'>
            <Icon name='calendar_month' className='mr-1.5 text-base' />
            {dateRange}
          </span>
        </div>
      </div>

      <div className='flex flex-shrink-0 items-center gap-4'>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-xs font-medium',
            status.color
          )}
        >
          {status.text}
        </span>
        <Icon
          name='chevron_right'
          className='text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary'
        />
      </div>
    </motion.div>
  );
};

export default TournamentListItem;
