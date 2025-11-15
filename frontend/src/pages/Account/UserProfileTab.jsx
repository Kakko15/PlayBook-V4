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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ProfilePictureManager from '@/components/ProfilePictureManager';

const profileSchema = z.object({
  pronouns: z.string().optional(),
  about_me: z.string().max(200, 'Must be 200 characters or less.').optional(),
  phone: z.string().optional(),
});

const UserProfileTab = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPfpModalOpen, setIsPfpModalOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { pronouns: '', about_me: '', phone: '' },
  });

  useEffect(() => {
    if (user) {
      api.getProfile().then((data) => {
        setProfile(data);
        form.reset({
          pronouns: data.pronouns || '',
          about_me: data.about_me || '',
          phone: data.phone || '',
        });
      });
    }
  }, [user, form]);

  const onProfileSubmit = async (values) => {
    setIsLoading(true);
    try {
      const { message } = await api.updateProfile(values);
      toast.success(message);
      const updatedProfile = await api.getProfile();
      setProfile(updatedProfile);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name = '') => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('');
  };

  const onPfpSuccess = (newImageUrl) => {
    setProfile((prev) => ({ ...prev, profile_picture_url: newImageUrl }));
    setIsPfpModalOpen(false);
  };

  return (
    <>
      <div className='mx-auto max-w-2xl p-4 pt-16 md:p-8'>
        <h2 className='mb-6 text-2xl font-semibold text-foreground'>
          User Profile
        </h2>

        <div className='mb-6 flex items-center gap-4'>
          <Avatar className='h-20 w-20'>
            <AvatarImage src={profile?.profile_picture_url} alt={user?.name} />
            <AvatarFallback className='bg-primary-container text-4xl text-on-primary-container'>
              {getInitials(user?.name)}
            </AvatarFallback>
          </Avatar>
          <Button onClick={() => setIsPfpModalOpen(true)}>Change Avatar</Button>
        </div>

        <Separator className='my-8' />

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onProfileSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='pronouns'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pronouns</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='e.g. he/him'
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='about_me'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>About Me</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Tell us about yourself...'
                      disabled={isLoading}
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='phone'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      type='tel'
                      placeholder='+63 9...'
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type='submit' disabled={isLoading}>
              {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Save Profile
            </Button>
          </form>
        </Form>
      </div>

      <ProfilePictureManager
        isOpen={isPfpModalOpen}
        onClose={() => setIsPfpModalOpen(false)}
        onSuccess={onPfpSuccess}
        currentImageUrl={profile?.profile_picture_url}
      />
    </>
  );
};

export default UserProfileTab;
