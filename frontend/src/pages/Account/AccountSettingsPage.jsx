import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Icon from '@/components/Icon';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { to: 'my-account', label: 'My Account' },
  { to: 'profile', label: 'User Profile' },
];

const AccountSettingsPage = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const getDashboardLink = () => {
    return user.role === 'super_admin' ? '/superadmin' : '/admin';
  };

  return (
    <div className='flex h-screen min-h-screen w-full bg-background'>
      <div className='flex h-full w-full p-4 md:p-8 lg:p-12'>
        <div className='flex w-full overflow-hidden rounded-lg border border-border'>
          <nav className='hidden w-64 flex-col border-r border-border bg-surface p-6 md:flex'>
            <div className='space-y-2'>
              <h3 className='mb-4 px-3 text-lg font-semibold text-foreground'>
                User Settings
              </h3>
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex h-10 w-full items-center rounded-md px-3 text-sm font-medium',
                      isActive
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
            <Separator className='my-4' />
            <Button
              variant='ghost'
              onClick={logout}
              className='hover:bg-destructive-container hover:text-on-destructive-container h-10 w-full justify-start rounded-md px-3 text-sm font-medium text-destructive'
            >
              Log Out
            </Button>
          </nav>

          <div className='relative flex-1 overflow-y-auto'>
            <Outlet />

            <Button
              variant='ghost'
              size='icon'
              className='absolute right-6 top-6 h-10 w-10 rounded-full border border-border'
              onClick={() => navigate(getDashboardLink())}
            >
              <Icon name='close' />
              <span className='sr-only'>Close</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettingsPage;
