import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import Icon from '@/components/Icon';

const AdminLayout = () => {
  const { user, logout } = useAuth();

  const getInitials = (name = '') => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('');
  };

  return (
    <div className='min-h-screen bg-background'>
      <header className='sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface px-4 md:px-8'>
        <Link to='/admin' className='flex items-center gap-2'>
          <Logo className='h-8 w-auto' />
          <span className='hidden text-xl font-bold text-on-surface sm:inline-block'>
            PlayBook
          </span>
        </Link>
        <div className='flex items-center gap-2'>
          <Button variant='ghost' className='flex items-center gap-2'>
            <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-on-primary-container'>
              <span className='font-semibold'>{getInitials(user?.name)}</span>
            </div>
            <div className='hidden flex-col items-start text-on-surface-variant sm:flex'>
              <span className='text-sm font-medium'>{user?.name}</span>
              <span className='text-xs text-muted-foreground'>Admin</span>
            </div>
          </Button>
          <Button variant='ghost' size='icon' onClick={logout} title='Logout'>
            <Icon name='logout' className='text-on-surface-variant' />
          </Button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
