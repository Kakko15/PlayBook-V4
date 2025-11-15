import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Icon from '@/components/Icon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { USER_ROLES } from '@/lib/constants';

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + 'y ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + 'mo ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + 'd ago';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + 'h ago';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + 'm ago';
  return Math.floor(seconds) + 's ago';
};

const ActivityItem = ({ icon, color, title, description, time }) => (
  <div className='flex items-start gap-3'>
    <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-surface-variant'>
      <Icon name={icon} className={cn('text-xl', color)} />
    </div>
    <div className='flex-1'>
      <p className='text-sm font-medium text-foreground'>{title}</p>
      <p className='text-sm text-muted-foreground'>{description}</p>
      <p className='text-xs text-muted-foreground'>{time}</p>
    </div>
  </div>
);

const ActivityFeed = () => {
  const { user } = useAuth();
  const [activity, setActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const isSuperAdmin = user.role === USER_ROLES.SUPER_ADMIN;

  useEffect(() => {
    const fetchActivity = async () => {
      setIsLoading(true);
      try {
        const data = await api.getRecentActivity();
        setActivity(data);
      } catch (error) {
        toast.error('Failed to load activity feed.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchActivity();
  }, []);

  return (
    <Card className='border-outline-variant'>
      <CardHeader>
        <CardTitle>Activity Feed</CardTitle>
        <CardDescription>See what's new in the system.</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        {isLoading ? (
          <div className='flex h-48 items-center justify-center'>
            <Loader2 className='h-8 w-8 animate-spin text-primary' />
          </div>
        ) : activity.length === 0 ? (
          <div className='flex h-48 flex-col items-center justify-center rounded-lg border-2 border-dashed border-outline-variant bg-surface'>
            <Icon
              name='notifications_off'
              className='text-5xl text-on-surface-variant'
            />
            <p className='mt-2 text-on-surface-variant'>No activity yet.</p>
          </div>
        ) : (
          activity.map((item) => (
            <ActivityItem
              key={item.id}
              icon={item.icon}
              color={item.color}
              title={item.title}
              description={item.description}
              time={formatTimeAgo(item.created_at)}
            />
          ))
        )}

        {isSuperAdmin && (
          <Button
            variant='outline'
            className='mt-2 w-full'
            onClick={() => toast('This will lead to the Activity Log page.')}
          >
            View All Activity
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
