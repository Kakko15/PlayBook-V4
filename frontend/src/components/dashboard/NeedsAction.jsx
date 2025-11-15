import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Icon from '@/components/Icon';
import { useAuth } from '@/hooks/useAuth';
import { USER_ROLES } from '@/lib/constants';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const ActionItem = ({ icon, title, description, to, colorClass }) => (
  <Link to={to} className='block'>
    <div className='flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-accent'>
      <div
        className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
          colorClass
        )}
      >
        <Icon name={icon} className='text-xl' />
      </div>
      <div className='flex-1'>
        <p className='text-sm font-medium text-foreground'>{title}</p>
        <p className='text-sm text-muted-foreground'>{description}</p>
      </div>
      <Icon name='chevron_right' className='text-muted-foreground' />
    </div>
  </Link>
);

const NeedsAction = ({
  pendingUsers = [],
  pendingMatches = [],
  analytics = null,
}) => {
  const { user } = useAuth();
  const isSuperAdmin = user.role === USER_ROLES.SUPER_ADMIN;

  const actions = [];

  if (isSuperAdmin && pendingUsers.length > 0) {
    actions.push({
      id: 'users',
      icon: 'how_to_reg',
      title: `Approve ${pendingUsers.length} New User${pendingUsers.length > 1 ? 's' : ''}`,
      description: `${pendingUsers[0].email} ${pendingUsers.length > 1 ? `+ ${pendingUsers.length - 1} more` : ''}`,
      to: '/superadmin/users',
      colorClass: 'bg-primary-container text-on-primary-container',
    });
  }

  if (pendingMatches.length > 0) {
    actions.push({
      id: 'matches',
      icon: 'pending_actions',
      title: `Log ${pendingMatches.length} Overdue Match Result${pendingMatches.length > 1 ? 's' : ''}`,
      description: 'Log results to update standings.',
      to: `/admin/tournament/${pendingMatches[0].tournament_id}`,
      colorClass: 'bg-secondary-container text-on-secondary-container',
    });
  }

  if (isSuperAdmin && analytics?.winPredictor) {
    const lastUpdated = new Date(analytics.winPredictor.updated_at);
    const now = new Date();
    const daysSinceUpdate = (now - lastUpdated) / (1000 * 60 * 60 * 24);

    if (daysSinceUpdate > 7) {
      actions.push({
        id: 'models',
        icon: 'model_training',
        title: 'Data Models are Stale',
        description: `Models last trained ${Math.floor(daysSinceUpdate)} days ago.`,
        to: '/superadmin/system',
        colorClass: 'bg-tertiary-container text-on-tertiary-container',
      });
    }
  }

  return (
    <Card className='border-outline-variant'>
      <CardHeader>
        <CardTitle>Needs Action</CardTitle>
        <CardDescription>Here are your most urgent tasks.</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-1 p-2'>
        {actions.length > 0 ? (
          actions.map((item) => <ActionItem key={item.id} {...item} />)
        ) : (
          <div className='flex flex-col items-center justify-center p-4 text-center'>
            <Icon
              name='task_alt'
              className='text-5xl text-on-surface-variant'
            />
            <p className='mt-2 font-medium text-on-surface'>All caught up!</p>
            <p className='text-sm text-on-surface-variant'>
              You have no urgent tasks.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NeedsAction;
