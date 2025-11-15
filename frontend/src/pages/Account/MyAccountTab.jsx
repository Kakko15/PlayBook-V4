import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const accountSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z
    .string()
    .email('Invalid email address.')
    .min(1, 'Email is required.'),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: z
      .string()
      .min(8, 'Must be at least 8 characters.')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
        'Must contain uppercase, lowercase, number, and special character.'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your new password.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

const MyAccountTab = () => {
  const { user, setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  const accountForm = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: { name: '', email: '' },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (user) {
      api.getAccountDetails().then((data) => {
        accountForm.reset({ name: data.name, email: data.email });
      });
    }
  }, [user, accountForm]);

  const onAccountSubmit = async (values) => {
    setIsLoading(true);
    try {
      const { user: updatedUser, message } =
        await api.updateAccountDetails(values);
      toast.success(message);
      setUser(updatedUser);
      localStorage.setItem('playbook-user', JSON.stringify(updatedUser));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update account.');
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (values) => {
    setIsPasswordLoading(true);
    try {
      const { message } = await api.updatePassword(values);
      toast.success(message);
      passwordForm.reset();
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to change password.'
      );
    } finally {
      setIsPasswordLoading(false);
    }
  };

  return (
    <div className='mx-auto max-w-2xl p-4 pt-16 md:p-8'>
      <h2 className='mb-6 text-2xl font-semibold text-foreground'>
        My Account
      </h2>
      <Form {...accountForm}>
        <form
          onSubmit={accountForm.handleSubmit(onAccountSubmit)}
          className='space-y-4'
        >
          <FormField
            control={accountForm.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input disabled={isLoading} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={accountForm.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type='email' disabled={isLoading} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type='submit' disabled={isLoading}>
            {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Save Changes
          </Button>
        </form>
      </Form>

      <Separator className='my-8' />

      <h3 className='mb-6 text-xl font-semibold text-foreground'>
        Change Password
      </h3>
      <Form {...passwordForm}>
        <form
          onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
          className='space-y-4'
        >
          <FormField
            control={passwordForm.control}
            name='currentPassword'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Password</FormLabel>
                <FormControl>
                  <Input
                    type='password'
                    disabled={isPasswordLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={passwordForm.control}
            name='newPassword'
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input
                    type='password'
                    disabled={isPasswordLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={passwordForm.control}
            name='confirmPassword'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <Input
                    type='password'
                    disabled={isPasswordLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type='submit' disabled={isPasswordLoading}>
            {isPasswordLoading && (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            )}
            Change Password
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default MyAccountTab;
