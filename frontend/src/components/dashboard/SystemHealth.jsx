import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/Icon';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const formatTimeAgo = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return `${Math.floor(interval)}y ago`;
  interval = seconds / 2592000;
  if (interval > 1) return `${Math.floor(interval)}mo ago`;
  interval = seconds / 86400;
  if (interval > 1) return `${Math.floor(interval)}d ago`;
  interval = seconds / 3600;
  if (interval > 1) return `${Math.floor(interval)}h ago`;
  interval = seconds / 60;
  if (interval > 1) return `${Math.floor(interval)}m ago`;
  return `${Math.floor(seconds)}s ago`;
};

const HealthItem = ({ icon, title, status, statusColor }) => (
  <div className='flex items-center justify-between'>
    <div className='flex items-center gap-3'>
      <Icon name={icon} className='text-xl text-muted-foreground' />
      <span className='font-medium text-foreground'>{title}</span>
    </div>
    <div className={cn('flex items-center gap-2', statusColor)}>
      <div className={cn('h-2 w-2 rounded-full', statusColor)} />
      <span className='font-medium'>{status}</span>
    </div>
  </div>
);

const SystemHealth = ({ backups, isLoading }) => {
  const lastBackup = backups?.[0];
  const lastBackupTime = lastBackup ? new Date(lastBackup.created_at) : null;
  const now = new Date();
  let backupStatus = 'Nominal';
  let backupColor = 'text-green-600';

  if (lastBackupTime) {
    const hoursSinceBackup = (now - lastBackupTime) / (1000 * 60 * 60);
    if (hoursSinceBackup > 48) {
      backupStatus = 'Critical';
      backupColor = 'text-destructive';
    } else if (hoursSinceBackup > 24) {
      backupStatus = 'Warning';
      backupColor = 'text-yellow-600';
    }
  } else if (!isLoading) {
    backupStatus = 'No Backups';
    backupColor = 'text-destructive';
  }

  return (
    <Card className='border-outline-variant'>
      <CardHeader>
        <CardTitle>System Health</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {isLoading ? (
          <div className='flex h-24 items-center justify-center'>
            <Loader2 className='h-6 w-6 animate-spin text-primary' />
          </div>
        ) : (
          <>
            <HealthItem
              icon='dns'
              title='API Status'
              status='Online'
              statusColor='text-green-600'
            />
            <HealthItem
              icon='database'
              title='Last Backup'
              status={lastBackup ? formatTimeAgo(lastBackup.created_at) : 'N/A'}
              statusColor={backupColor}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemHealth;
