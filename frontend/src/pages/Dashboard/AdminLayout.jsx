import { Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const AdminLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div>
      <nav className="flex justify-between p-4 bg-primary text-primary-foreground">
        <h1 className="font-bold">PlayBook Admin</h1>
        <div>
          <span>{user?.email} (Admin)</span>
          <button onClick={logout} className="ml-4 underline">Logout</button>
        </div>
      </nav>
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;