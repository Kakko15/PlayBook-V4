import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Button, buttonVariants } from '@/components/ui/button';
import { UserCheck, UserX, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alertDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdownMenu';
import Icon from '@/components/Icon';
import { cn } from '@/lib/utils';
import ResetPasswordModal from '@/components/ResetPasswordModal';
import { useAuth } from '@/hooks/useAuth';

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
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
};

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const { user: currentUser } = useAuth();

  const [userToReject, setUserToReject] = useState(null);
  const [isRejectAlertOpen, setIsRejectAlertOpen] = useState(false);

  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const [userToReset, setUserToReset] = useState(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
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
  }, []);

  const pollUsers = useCallback(async () => {
    try {
      const [allUsers, pending] = await Promise.all([
        api.getAllUsers(),
        api.getPendingUsers(),
      ]);
      setUsers(allUsers);
      setPendingUsers(pending);
    } catch (error) {
      console.error('Polling failed:', error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();

    const intervalId = setInterval(() => {
      pollUsers();
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchUsers, pollUsers]);

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

  const handleRejectClick = (user) => {
    setUserToReject(user);
    setIsRejectAlertOpen(true);
  };

  const confirmReject = async () => {
    if (!userToReject) return;

    setActionLoading(userToReject.id);
    setIsRejectAlertOpen(false);
    try {
      await api.deleteUser(userToReject.id);
      toast.success('User rejected and deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject user');
    } finally {
      setActionLoading(null);
      setUserToReject(null);
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

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    setActionLoading(userToDelete.id);
    setIsDeleteAlertOpen(false);
    try {
      await api.deleteUser(userToDelete.id);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(null);
      setUserToDelete(null);
    }
  };

  const handleResetPasswordClick = (user) => {
    setUserToReset(user);
    setIsResetModalOpen(true);
  };

  if (loading && users.length === 0) {
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

      <AnimatePresence>
        {pendingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{
              opacity: 0,
              height: 0,
              y: -20,
              transition: { duration: 0.3 },
            }}
            className='rounded-lg border border-outline-variant bg-secondary-container/30 p-6'
          >
            <h2 className='mb-4 text-xl font-semibold text-on-secondary-container'>
              Pending Approvals ({pendingUsers.length})
            </h2>
            <motion.div
              className='space-y-3'
              variants={listVariants}
              initial='hidden'
              animate='show'
            >
              <AnimatePresence>
                {pendingUsers.map((user) => (
                  <motion.div
                    key={user.id}
                    variants={itemVariants}
                    layout
                    exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }}
                    className='flex items-center justify-between rounded-lg border border-outline-variant bg-surface p-4'
                  >
                    <div>
                      <p className='font-medium text-foreground'>{user.name}</p>
                      <p className='text-sm text-muted-foreground'>
                        {user.email}
                      </p>
                      <p className='mt-1 text-xs text-muted-foreground'>
                        Requested:{' '}
                        {new Date(user.created_at).toLocaleDateString()}
                      </p>
                      <p
                        className={`mt-1 text-xs font-medium ${
                          user.status === 'pending'
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        }`}
                      >
                        Status:{' '}
                        {user.status === 'pending'
                          ? 'Pending Email Verification'
                          : 'Pending Approval'}
                      </p>
                    </div>
                    <div className='flex gap-2'>
                      <Button
                        onClick={() => handleApprove(user.id)}
                        disabled={
                          actionLoading === user.id || user.status === 'pending'
                        }
                        size='sm'
                        className='bg-primary hover:bg-primary/90'
                        title={
                          user.status === 'pending'
                            ? 'User has not verified email yet'
                            : 'Approve user'
                        }
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
                      <Button
                        variant='destructive'
                        size='sm'
                        onClick={() => handleRejectClick(user)}
                        disabled={actionLoading === user.id}
                        title='Reject and delete user'
                      >
                        {actionLoading === user.id ? (
                          <Loader2 className='h-4 w-4 animate-spin' />
                        ) : (
                          <UserX className='h-4 w-4' />
                        )}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
            <motion.tbody
              variants={listVariants}
              initial='hidden'
              animate='show'
            >
              <AnimatePresence>
                {users.map((user) => (
                  <motion.tr
                    key={user.id}
                    variants={itemVariants}
                    layout
                    exit='exit'
                    className='border-b border-border last:border-b-0 hover:bg-muted/50'
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
                            : 'bg-secondary-container text-on-secondary-container'
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
                      <div className='flex items-center justify-end'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8'
                              disabled={actionLoading === user.id}
                            >
                              {actionLoading === user.id ? (
                                <Loader2 className='h-4 w-4 animate-spin' />
                              ) : (
                                <Icon name='more_horiz' className='text-lg' />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem
                              onClick={() =>
                                handleToggleRole(user.id, user.role)
                              }
                            >
                              <Icon
                                name='military_tech'
                                className='mr-2 text-lg'
                              />
                              {user.role === 'admin'
                                ? 'Make Super Admin'
                                : 'Make Admin'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleToggleStatus(user.id, user.status)
                              }
                              className={cn(
                                user.status === 'active'
                                  ? 'text-destructive focus:bg-destructive-container focus:text-destructive'
                                  : 'text-green-600 focus:bg-green-100'
                              )}
                              disabled={user.id === currentUser.id}
                            >
                              <Icon
                                name={
                                  user.status === 'active'
                                    ? 'toggle_off'
                                    : 'toggle_on'
                                }
                                className='mr-2 text-lg'
                              />
                              {user.status === 'active'
                                ? 'Suspend Account'
                                : 'Activate Account'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleResetPasswordClick(user)}
                            >
                              <Icon
                                name='lock_reset'
                                className='mr-2 text-lg'
                              />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(user)}
                              className='text-destructive focus:bg-destructive-container focus:text-destructive'
                              disabled={user.id === currentUser.id}
                            >
                              <Icon name='delete' className='mr-2 text-lg' />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </motion.tbody>
          </table>
        </div>
      </div>

      <AlertDialog open={isRejectAlertOpen} onOpenChange={setIsRejectAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user "
              <span className='font-medium text-foreground'>
                {userToReject?.name}
              </span>
              " ({userToReject?.email}). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReject}
              className={buttonVariants({ variant: 'destructive' })}
            >
              Yes, Reject User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user "
              <span className='font-medium text-foreground'>
                {userToDelete?.name}
              </span>
              " ({userToDelete?.email}). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className={buttonVariants({ variant: 'destructive' })}
            >
              Yes, Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ResetPasswordModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        user={userToReset}
      />
    </div>
  );
};

export default UserManagementPage;
