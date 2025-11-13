import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const SuperAdminLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div>
      <nav className='flex justify-between bg-destructive p-4 text-destructive-foreground'>
        <h1 className='font-bold'>PlayBook Super Admin</h1>
        <div>
          <span>{user?.email} (Super Admin)</span>
          <button onClick={logout} className='ml-4 underline'>
            Logout
          </button>
        </div>
      </nav>
      <div className='flex'>
        <aside className='min-h-screen w-64 bg-muted p-4'>
          <nav className='flex flex-col gap-2'>
            <Link
              to='/superadmin/dashboard'
              className='rounded-md p-2 font-semibold hover:bg-accent'
            >
              Dashboard
            </Link>
            <Link
              to='/superadmin/users'
              className='rounded-md p-2 font-semibold hover:bg-accent'
            >
              User Management
            </Link>
            <Link
              to='/superadmin/system'
              className='rounded-md p-2 font-semibold hover:bg-accent'
            >
              System
            </Link>
          </nav>
        </aside>
        <main className='flex-1 p-8'>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
