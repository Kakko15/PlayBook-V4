import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import TournamentCard from '@/components/TournamentCard';
import TournamentCardSkeleton from '@/components/TournamentCardSkeleton';
import TournamentListItem from '@/components/TournamentListItem';
import TournamentListItemSkeleton from '@/components/TournamentListItemSkeleton';
import CreateTournamentModal from '@/components/CreateTournamentModal';
import ViewToggle from '@/components/ui/ViewToggle';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/components/Icon';
import { cn } from '@/lib/utils';

const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 1, 0.5, 1],
    },
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100 },
  },
};

const getStatus = (startDate) => {
  if (!startDate) return { text: 'Pending' };
  const now = new Date();
  const start = new Date(startDate);
  if (start > now) return { text: 'Upcoming' };
  return { text: 'Ongoing' };
};

const StatCard = ({ icon, title, value, colorClass }) => (
  <motion.div
    variants={itemVariants}
    className={cn(
      'flex items-center gap-4 rounded-xl border border-outline-variant bg-surface-variant p-4'
    )}
  >
    <div
      className={cn(
        'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full',
        colorClass
      )}
    >
      <Icon name={icon} className='text-3xl' />
    </div>
    <div>
      <div className='text-sm font-medium text-on-surface-variant'>{title}</div>
      <div className='font-sans text-3xl font-bold text-on-surface'>
        {value}
      </div>
    </div>
  </motion.div>
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [stats, setStats] = useState({ total: 0, ongoing: 0, upcoming: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [view, setView] = useState('grid');

  const fetchTournaments = async () => {
    setIsLoading(true);
    try {
      const data = await api.getMyTournaments();
      setTournaments(data);

      const ongoing = data.filter(
        (t) => getStatus(t.start_date).text === 'Ongoing'
      ).length;
      const upcoming = data.filter(
        (t) => getStatus(t.start_date).text === 'Upcoming'
      ).length;
      setStats({
        total: data.length,
        ongoing,
        upcoming,
      });
    } catch (error) {
      toast.error('Failed to fetch tournaments.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const getFirstName = () => {
    return user?.name.split(' ')[0] || 'Admin';
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <motion.div
          key='loading'
          className={
            view === 'grid'
              ? 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'
              : 'flex flex-col gap-4'
          }
        >
          {view === 'grid' ? (
            <>
              <TournamentCardSkeleton />
              <TournamentCardSkeleton />
              <TournamentCardSkeleton />
            </>
          ) : (
            <>
              <TournamentListItemSkeleton />
              <TournamentListItemSkeleton />
              <TournamentListItemSkeleton />
            </>
          )}
        </motion.div>
      );
    }

    if (tournaments.length === 0) {
      return (
        <motion.div
          key='empty'
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className='flex h-64 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-outline-variant bg-surface-variant'
        >
          <Icon
            name='event_note'
            className='text-6xl text-on-surface-variant'
          />
          <h3 className='mt-4 text-xl font-semibold text-on-surface'>
            No tournaments yet
          </h3>
          <p className='mt-2 text-on-surface-variant'>
            Click "Create Tournament" to get started.
          </p>
        </motion.div>
      );
    }

    return (
      <motion.div
        key='tournaments'
        className={
          view === 'grid'
            ? 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'
            : 'flex flex-col gap-4'
        }
        variants={containerVariants}
        initial='hidden'
        animate='show'
      >
        {tournaments.map((tournament) =>
          view === 'grid' ? (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ) : (
            <TournamentListItem key={tournament.id} tournament={tournament} />
          )
        )}
      </motion.div>
    );
  };

  return (
    <motion.div
      className='container mx-auto p-4 md:p-8'
      variants={pageVariants}
      initial='hidden'
      animate='show'
    >
      <h1 className='font-sans text-4xl font-bold tracking-tight text-on-surface'>
        Welcome back, {getFirstName()}!
      </h1>
      <p className='mt-2 text-lg text-on-surface-variant'>
        Here is your dashboard overview.
      </p>

      <motion.div
        className='my-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
        variants={containerVariants}
        initial='hidden'
        animate='show'
      >
        <StatCard
          icon='event'
          title='Total Tournaments'
          value={isLoading ? '...' : stats.total}
          colorClass='bg-primary-container text-on-primary-container'
        />
        <StatCard
          icon='play_circle'
          title='Ongoing Tournaments'
          value={isLoading ? '...' : stats.ongoing}
          colorClass='bg-secondary-container text-on-secondary-container'
        />
        <StatCard
          icon='pending'
          title='Upcoming Tournaments'
          value={isLoading ? '...' : stats.upcoming}
          colorClass='bg-tertiary-container text-on-tertiary-container'
        />
      </motion.div>

      <div className='mb-6 flex items-center justify-between'>
        <h2 className='font-sans text-2xl font-bold text-on-surface'>
          Your Tournaments
        </h2>
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      <AnimatePresence mode='wait'>{renderContent()}</AnimatePresence>

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.5, ease: 'easeOut' }}
        className='fixed bottom-8 right-8 z-30'
      >
        <Button
          size='lg'
          className='h-auto rounded-2xl bg-primary-container px-6 py-4 text-on-primary-container shadow-lg transition-all hover:bg-primary-container/90'
          onClick={() => setShowCreateModal(true)}
        >
          <Icon name='add' className='mr-2 text-2xl' />
          <span className='text-base font-medium'>Create Tournament</span>
        </Button>
      </motion.div>

      <CreateTournamentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchTournaments();
        }}
      />
    </motion.div>
  );
};

export default AdminDashboard;
