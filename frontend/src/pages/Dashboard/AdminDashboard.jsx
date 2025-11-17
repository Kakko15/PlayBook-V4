import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { containerVariants, itemVariants } from '@/lib/animations';
import { StatCard } from '@/components/dashboard/StatCard';
import NeedsAction from '@/components/dashboard/NeedsAction';
import QuickActions from '@/components/dashboard/QuickActions';
import WelcomeBanner from '@/components/dashboard/WelcomeBanner';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import ArchetypePieChart from '@/components/dashboard/ArchetypePieChart';
import EngagementChart from '@/components/dashboard/EngagementChart';
import SystemHealth from '@/components/dashboard/SystemHealth';
import CreateTournamentModal from '@/components/CreateTournamentModal';
import LogMatchModal from '@/components/LogMatchModal';
import TournamentListItem from '@/components/TournamentListItem';
import TournamentListItemSkeleton from '@/components/TournamentListItemSkeleton';
import UpNextCard from '@/components/dashboard/UpNextCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/Icon';
import { USER_ROLES } from '@/lib/constants';

const getStatus = (startDate) => {
  if (!startDate) return { text: 'Pending' };
  const now = new Date();
  const start = new Date(startDate);
  if (start > now) return { text: 'Upcoming' };
  return { text: 'Ongoing' };
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingMatches, setPendingMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [engagementData, setEngagementData] = useState([]);
  const [backups, setBackups] = useState([]);
  const [stats, setStats] = useState({ total: 0, ongoing: 0, upcoming: 0 });
  const [saStats, setSaStats] = useState({ totalUsers: 0 });
  const [nextMatch, setNextMatch] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const tournamentDataPromise = api.getMyTournaments();
      let pendingUsersPromise = Promise.resolve([]);
      let allUsersPromise = Promise.resolve([]);
      let analyticsPromise = Promise.resolve(null);
      let backupsPromise = Promise.resolve([]);

      if (user.role === USER_ROLES.SUPER_ADMIN) {
        pendingUsersPromise = api.getPendingUsers();
        allUsersPromise = api.getAllUsers();
        analyticsPromise = api.getGlobalAnalytics();
        backupsPromise = api.getBackups();
      }

      const [data, pendingData, allUsersData, analyticsData, backupData] =
        await Promise.all([
          tournamentDataPromise,
          pendingUsersPromise,
          allUsersPromise,
          analyticsPromise,
          backupsPromise,
        ]);

      setPendingUsers(pendingData);
      setTournaments(data);
      if (analyticsData) setAnalytics(analyticsData);
      if (backupData) setBackups(backupData);

      if (user.role === USER_ROLES.SUPER_ADMIN) {
        setSaStats({ totalUsers: allUsersData.length });
      }

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

      const activeTournaments = data.filter(
        (t) =>
          getStatus(t.start_date).text === 'Ongoing' ||
          getStatus(t.start_date).text === 'Upcoming'
      );
      const activeTournamentIds = activeTournaments.map((t) => t.id);

      if (activeTournamentIds.length > 0) {
        const schedulePromises = activeTournamentIds.map((id) =>
          api.getSchedule(id)
        );
        const allSchedules = (await Promise.all(schedulePromises)).flat();

        const engagementPromises = activeTournamentIds.map((id) =>
          api.getPickLeaderboard(id).then((leaderboard) => ({
            id,
            participants: leaderboard.length,
          }))
        );
        const engagementResults = await Promise.all(engagementPromises);

        setEngagementData(
          engagementResults
            .map((result) => {
              const tournament = data.find((t) => t.id === result.id);
              return {
                name: tournament?.name || 'Unknown',
                participants: result.participants,
              };
            })
            .filter((d) => d.participants > 0)
        );

        const now = new Date();
        const overdueMatches = allSchedules.filter(
          (m) =>
            m.status === 'pending' &&
            m.match_date &&
            new Date(m.match_date) < now
        );
        setPendingMatches(overdueMatches);

        const upcomingPendingMatches = allSchedules
          .filter(
            (m) =>
              m.status === 'pending' &&
              m.match_date &&
              new Date(m.match_date) >= now
          )
          .sort((a, b) => new Date(a.match_date) - new Date(b.match_date));

        setNextMatch(upcomingPendingMatches[0] || null);
      } else {
        setPendingMatches([]);
        setNextMatch(null);
        setEngagementData([]);
      }
    } catch (error) {
      toast.error('Failed to fetch dashboard data.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!user) {
    return null;
  }

  const handleCreateClick = () => setShowCreateModal(true);
  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchData();
  };

  const handleLogResultClick = (match) => {
    setSelectedMatch(match);
    setIsLogModalOpen(true);
  };

  const onLogModalClose = () => {
    setIsLogModalOpen(false);
    setSelectedMatch(null);
  };

  const onLogModalSuccess = () => {
    onLogModalClose();
    fetchData();
  };

  const activeTournamentsForList = tournaments
    .filter(
      (t) =>
        getStatus(t.start_date).text === 'Ongoing' ||
        getStatus(t.start_date).text === 'Upcoming'
    )
    .slice(0, 5);

  const nextMatchTournamentName = nextMatch
    ? tournaments.find((t) => t.id === nextMatch.tournament_id)?.name
    : null;

  const selectedMatchGame = selectedMatch
    ? tournaments.find((t) => t.id === selectedMatch.tournament_id)?.game
    : null;

  return (
    <>
      <motion.div
        className='relative'
        initial='hidden'
        animate='show'
        variants={containerVariants}
      >
        <header className='sticky top-0 z-10 border-b border-outline-variant bg-surface/80 px-4 py-4 backdrop-blur-sm md:px-8'>
          <div className='container mx-auto flex items-center justify-between'>
            <h1 className='font-sans text-2xl font-bold tracking-tight text-on-surface'>
              Dashboard
            </h1>
            <Button
              variant='ghost'
              size='icon'
              onClick={toggleTheme}
              className='rounded-full'
              aria-label='Toggle theme'
            >
              <Icon name={isDark ? 'light_mode' : 'dark_mode'} className='text-xl' />
            </Button>
          </div>
        </header>

        <div className='container mx-auto grid grid-cols-1 gap-8 p-4 md:p-8 lg:grid-cols-3'>
          <div className='flex flex-col gap-6 lg:col-span-2'>
            <WelcomeBanner onCreateTournamentClick={handleCreateClick} />

            {user.role === USER_ROLES.ADMIN && (
              <UpNextCard
                nextMatch={nextMatch}
                tournamentName={nextMatchTournamentName}
                onLogResult={handleLogResultClick}
              />
            )}

            <motion.div
              className='grid grid-cols-1 gap-4 sm:grid-cols-3'
              variants={containerVariants}
              initial='hidden'
              animate='show'
            >
              {user.role === USER_ROLES.SUPER_ADMIN ? (
                <>
                  <StatCard
                    title='Total Users'
                    value={isLoading ? '-' : saStats.totalUsers}
                    icon='group'
                    colorClass='bg-primary-container'
                    onColorClass='text-on-primary-container'
                  />
                  <StatCard
                    title='Pending Users'
                    value={isLoading ? '-' : pendingUsers.length}
                    icon='how_to_reg'
                    colorClass='bg-secondary-container'
                    onColorClass='text-on-secondary-container'
                  />
                  <StatCard
                    title='Total Tournaments'
                    value={isLoading ? '-' : stats.total}
                    icon='event'
                    colorClass='bg-tertiary-container'
                    onColorClass='text-on-tertiary-container'
                  />
                </>
              ) : (
                <>
                  <StatCard
                    title='Total Tournaments'
                    value={isLoading ? '-' : stats.total}
                    icon='event'
                    colorClass='bg-primary-container'
                    onColorClass='text-on-primary-container'
                  />
                  <StatCard
                    title='Ongoing'
                    value={isLoading ? '-' : stats.ongoing}
                    icon='play_circle'
                    colorClass='bg-secondary-container'
                    onColorClass='text-on-secondary-container'
                  />
                  <StatCard
                    title='Upcoming'
                    value={isLoading ? '-' : stats.upcoming}
                    icon='pending'
                    colorClass='bg-tertiary-container'
                    onColorClass='text-on-tertiary-container'
                  />
                </>
              )}
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className='flex-row items-center justify-between'>
                  <CardTitle>Active Tournaments</CardTitle>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => navigate('/admin/tournaments')}
                  >
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className='flex flex-col gap-3'>
                    {isLoading ? (
                      <>
                        <TournamentListItemSkeleton />
                        <TournamentListItemSkeleton />
                      </>
                    ) : activeTournamentsForList.length > 0 ? (
                      activeTournamentsForList.map((tournament) => (
                        <TournamentListItem
                          key={tournament.id}
                          tournament={tournament}
                        />
                      ))
                    ) : (
                      <div className='flex h-32 flex-col items-center justify-center rounded-lg border-2 border-dashed border-outline-variant bg-surface'>
                        <Icon
                          name='event_note'
                          className='text-5xl text-on-surface-variant'
                        />
                        <p className='mt-2 font-medium text-on-surface'>
                          No active tournaments... yet!
                        </p>
                        <p className='mt-1 text-sm text-on-surface-variant/70'>
                          Create one from the "Quick Actions" panel.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {user.role === USER_ROLES.ADMIN && (
              <motion.div variants={itemVariants}>
                <EngagementChart
                  engagementData={engagementData}
                  isLoading={isLoading}
                />
              </motion.div>
            )}

            <motion.div variants={itemVariants}>
              <ActivityFeed />
            </motion.div>

            {user.role === USER_ROLES.SUPER_ADMIN && (
              <motion.div variants={itemVariants}>
                <ArchetypePieChart
                  analytics={analytics}
                  isLoading={isLoading}
                />
              </motion.div>
            )}
          </div>

          <div className='flex flex-col gap-6 lg:col-span-1'>
            <motion.div variants={itemVariants}>
              <NeedsAction
                pendingUsers={pendingUsers}
                pendingMatches={pendingMatches}
                analytics={analytics}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <QuickActions onCreateTournamentClick={handleCreateClick} />
            </motion.div>
            {user.role === USER_ROLES.SUPER_ADMIN && (
              <motion.div variants={itemVariants}>
                <SystemHealth backups={backups} isLoading={isLoading} />
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
      <CreateTournamentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
      <LogMatchModal
        isOpen={isLogModalOpen}
        onClose={onLogModalClose}
        onSuccess={onLogModalSuccess}
        match={selectedMatch}
        game={selectedMatchGame}
      />
    </>
  );
};

export default AdminDashboard;
