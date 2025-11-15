import { useNavigate } from 'react-router-dom';
import { Reorder, useDragControls } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MoreVertical, CalendarDays, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
  getGameDetails,
  formatDateRange,
  getStatus,
} from '@/lib/tournamentUtils.jsx';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'tween', duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
};

const TournamentCard = ({ tournament, isPublic = false, className }) => {
  const navigate = useNavigate();
  const dragControls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);

  if (!tournament) return null;

  const gameDetails = getGameDetails(tournament.game);
  const teamCount = tournament.teams?.[0]?.count || 0;
  const status = getStatus(tournament.start_date);
  const dateRange = formatDateRange(tournament.start_date, tournament.end_date);

  const handleClick = () => {
    if (isDragging) return;
    const path = isPublic
      ? `/tournaments/${tournament.id}`
      : `/admin/tournament/${tournament.id}`;
    navigate(path);
  };

  const onCardAction = (e) => {
    e.stopPropagation();
  };

  const handlePointerDown = (e) => {
    if (e.target.closest('button') || e.target.closest('a')) return;
    dragControls.start(e);
  };

  const handleDragStart = () => {
    setIsDragging(true);
    document.body.classList.add('is-dragging');
  };

  const handleDragEnd = () => {
    document.body.classList.remove('is-dragging');
    setTimeout(() => setIsDragging(false), 0);
  };

  return (
    <Reorder.Item
      value={tournament}
      variants={itemVariants}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      dragListener={false}
      dragControls={dragControls}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      layout
      transition={{
        layout: {
          type: 'tween',
          duration: 0.25,
          ease: [0.4, 0, 0.2, 1],
        },
      }}
      whileDrag={{
        scale: 1.05,
        cursor: 'grabbing',
        zIndex: 10,
        boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        transition: {
          duration: 0.15,
        },
      }}
      className={cn(
        'group cursor-grab select-none overflow-hidden rounded-lg bg-card shadow-lg transition-shadow duration-300 ease-out hover:shadow-2xl',
        className
      )}
    >
      <div
        className={cn(
          'relative flex h-32 items-center justify-center p-4',
          gameDetails.bgColor
        )}
      >
        {gameDetails.icon}

        {!isPublic && (
          <Button
            variant='ghost'
            size='icon'
            className='absolute right-3 top-3 h-9 w-9 scale-[0.8] rounded-full bg-white/70 text-black opacity-0 transition-[opacity,transform] duration-200 ease-out hover:scale-100 hover:bg-[#fff] group-hover:scale-100 group-hover:opacity-100'
            onClick={onCardAction}
          >
            <MoreVertical className='h-5 w-5' />
          </Button>
        )}
      </div>

      <div className='space-y-3 bg-card p-4'>
        <h3
          className='truncate font-sans text-xl font-bold text-foreground'
          title={tournament.name}
        >
          {tournament.name}
        </h3>

        <div className='flex items-center justify-between text-sm'>
          <div className='flex items-center text-muted-foreground'>
            <Users className='mr-2 h-4 w-4' />
            <span>
              {teamCount} team{teamCount !== 1 ? 's' : ''}
            </span>
          </div>
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-xs font-medium',
              status.color
            )}
          >
            {status.text}
          </span>
        </div>

        <div className='flex items-center text-sm text-muted-foreground'>
          <CalendarDays className='mr-2 h-4 w-4' />
          <span>{dateRange}</span>
        </div>
      </div>
    </Reorder.Item>
  );
};

export default TournamentCard;
