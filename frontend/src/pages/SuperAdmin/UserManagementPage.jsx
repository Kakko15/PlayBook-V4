import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { UserCheck, UserX, Shield, Ban, Trash2, Loader2 } from 'lucide-react';

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 100 } },
};

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const [allUsers, pending] = await Promise.all([
        api.getAllUsers(),
        api.getPendingUsers(),
      ]);
      setUsers(allUsers);
      setPendingUsers(pending);
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (userId) => {
    setActionLoading(userId);
    try {
      await api.approveUser(userId);
      toast.success('User approved successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'super_admin' : 'admin';
    setActionLoading(userId);
    try {
      await api.updateUserRole(userId, newRole);
      toast.success(
        `User role updated to ${newRole === 'super_admin' ? 'Super Admin' : 'Admin'}`
      );
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    setActionLoading(userId);
    try {
      await api.updateUserStatus(userId, newStatus);
      toast.success(
        `User ${newStatus === 'active' ? 'activated' : 'suspended'}`
      );
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId) => {
    if (
      !confirm(
        'Are you sure you want to delete this user? This action cannot be undone.'
      )
    ) {
      return;
    }
    setActionLoading(userId);
    try {
      await api.deleteUser(userId);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-3xl font-bold text-foreground'>User Management</h1>
        <p className='mt-2 text-muted-foreground'>
          Approve pending users and manage existing accounts
        </p>
      </div>

      {pendingUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='rounded-lg border border-outline-variant bg-secondary-container/30 p-6'
        >
          <h2 className='text-on-secondary-container mb-4 text-xl font-semibold'>
            Pending Approvals ({pendingUsers.length})
          </h2>
          <motion.div
            className='space-y-3'
            variants={listVariants}
            initial='hidden'
            animate='show'
          >
            {pendingUsers.map((user) => (
              <motion.div
                key={user.id}
                variants={itemVariants}
                className='flex items-center justify-between rounded-lg border border-outline-variant bg-surface p-4'
              >
                <div>
                  <p className='font-medium text-foreground'>{user.name}</p>
                  <p className='text-sm text-muted-foreground'>{user.email}</p>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    Requested: {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  onClick={() => handleApprove(user.id)}
                  disabled={actionLoading === user.id}
                  size='sm'
                  className='bg-primary hover:bg-primary/90'
                >
                  {actionLoading === user.id ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <>
                      <UserCheck className='mr-2 h-4 w-4' />
                      Approve
                    </>
                  )}
                </Button>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}

      <div className='rounded-lg border border-border bg-card p-6'>
        <h2 className='mb-4 text-xl font-semibold text-foreground'>
          All Users ({users.length})
        </h2>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-border'>
                <th className='px-4 py-3 text-left font-medium text-muted-foreground'>
                  Name
                </th>
                <th className='px-4 py-3 text-left font-medium text-muted-foreground'>
                  Email
                </th>
                <th className='px-4 py-3 text-left font-medium text-muted-foreground'>
                  Role
                </th>
                <th className='px-4 py-3 text-left font-medium text-muted-foreground'>
                  Status
                </th>
                <th className='px-4 py-3 text-left font-medium text-muted-foreground'>
                  2FA
                </th>
                <th className='px-4 py-3 text-right font-medium text-muted-foreground'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className='border-b border-border hover:bg-muted/50'
                >
                  <td className='px-4 py-3 text-foreground'>{user.name}</td>
                  <td className='px-4 py-3 text-muted-foreground'>
                    {user.email}
                  </td>
                  <td className='px-4 py-3'>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        user.role === 'super_admin'
                          ? 'text-on-tertiary-container bg-tertiary-container'
                          : 'text-on-secondary-container bg-secondary-container'
                      }`}
                    >
                      {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                    </span>
                  </td>
                  <td className='px-4 py-3'>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : user.status === 'suspended'
                            ? 'text-on-destructive-container bg-destructive-container'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className='px-4 py-3'>
                    <span
                      className={`text-xs ${
                        user.otp_enabled ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      {user.otp_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className='px-4 py-3'>
                    <div className='flex items-center justify-end gap-2'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleToggleRole(user.id, user.role)}
                        disabled={actionLoading === user.id}
                        title={`Change to ${user.role === 'admin' ? 'Super Admin' : 'Admin'}`}
                      >
                        <Shield className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleToggleStatus(user.id, user.status)}
                        disabled={
                          actionLoading === user.id || user.status === 'pending'
                        }
                        title={
                          user.status === 'active' ? 'Suspend' : 'Activate'
                        }
                      >
                        {user.status === 'active' ? (
                          <Ban className='h-4 w-4 text-orange-600' />
                        ) : (
                          <UserCheck className='h-4 w-4 text-green-600' />
                        )}
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleDelete(user.id)}
                        disabled={actionLoading === user.id}
                        title='Delete user'
                      >
                        <Trash2 className='h-4 w-4 text-red-600' />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;
