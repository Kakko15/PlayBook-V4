import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Eye, EyeOff, XCircle, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import PasswordValidationHints from '@/components/PasswordValidationHints';
import AuthLayout from '@/components/AuthLayout';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
};

const passwordValidation = new RegExp(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
);

const formSchema = z
  .object({
    firstName: z.string().min(1, { message: 'First name is required.' }),
    lastName: z.string().min(1, { message: 'Last name is required.' }),
    email: z
      .string()
      .min(1, { message: 'Email is required.' })
      .email('Please enter a valid email address.'),
    password: z
      .string()
      .min(1, { message: 'Password is required.' })
      .regex(passwordValidation, {
        message: 'Password must meet all requirements.',
      }),
    confirmPassword: z
      .string()
      .min(1, { message: 'Please confirm your password.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

const SignupPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signup, setUser } = useAuth();
  const navigate = useNavigate();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const [passwordValidationState, setPasswordValidationState] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    specialChar: false,
  });

  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const watchedPassword = form.watch('password');
  const watchedConfirmPassword = form.watch('confirmPassword');

  useEffect(() => {
    setPasswordValidationState({
      length: watchedPassword.length >= 8,
      lowercase: /[a-z]/.test(watchedPassword),
      uppercase: /[A-Z]/.test(watchedPassword),
      number: /[0-9]/.test(watchedPassword),
      specialChar: /[^A-Za-z0-9]/.test(watchedPassword),
    });
  }, [watchedPassword]);

  const allRulesMet = Object.values(passwordValidationState).every(Boolean);

  const getMatchStatus = () => {
    if (watchedConfirmPassword.length > 0 && allRulesMet) {
      return watchedPassword === watchedConfirmPassword
        ? 'matching'
        : 'mismatch';
    }
    return 'idle';
  };
  const matchStatus = getMatchStatus();

  const handleGoogleSignup = () => {
    const googleClientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      '759620578509-a59st7kq2so8q2oj81gjbtug9op4q2sv.apps.googleusercontent.com';
    const redirectUri = encodeURIComponent(
      `${window.location.origin}/auth/callback/google`
    );
    const state = encodeURIComponent(JSON.stringify({ from: 'signup' }));
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=select_account&state=${state}`;
    window.location.href = googleAuthUrl;
  };

  const handleDiscordSignup = () => {
    const discordClientId =
      import.meta.env.VITE_DISCORD_CLIENT_ID || '1435255638383919177';
    const redirectUri = encodeURIComponent(
      `${window.location.origin}/auth/callback/discord`
    );
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordClientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify%20email`;
    window.location.href = discordAuthUrl;
  };

  const onSubmit = async (values) => {
    setIsLoading(true);

    if (!executeRecaptcha) {
      toast.error('reCAPTCHA not ready. Please try again.');
      setIsLoading(false);
      return;
    }

    try {
      const name = `${values.firstName} ${values.lastName}`;
      const recaptchaToken = await executeRecaptcha('signup');
      const data = await signup(
        name,
        values.email,
        values.password,
        recaptchaToken
      );
      toast.success(data.message);
      navigate('/pending-approval');
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title='Create your account'
      description={
        <>
          Already have an account?{' '}
          <Link
            to='/login'
            className='font-semibold text-primary hover:text-primary/90'
            replace
          >
            Sign in
          </Link>
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <FormField
              control={form.control}
              name='firstName'
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete='given-name'
                      disabled={isLoading}
                      {...field}
                      className={
                        fieldState.error
                          ? 'border-destructive focus-visible:ring-destructive'
                          : ''
                      }
                    />
                  </FormControl>
                  <div className='h-5'>
                    <AnimatePresence>
                      {fieldState.error && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <FormMessage />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='lastName'
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete='family-name'
                      disabled={isLoading}
                      {...field}
                      className={
                        fieldState.error
                          ? 'border-destructive focus-visible:ring-destructive'
                          : ''
                      }
                    />
                  </FormControl>
                  <div className='h-5'>
                    <AnimatePresence>
                      {fieldState.error && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <FormMessage />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name='email'
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <Input
                    autoComplete='email'
                    disabled={isLoading}
                    {...field}
                    className={
                      fieldState.error
                        ? 'border-destructive focus-visible:ring-destructive'
                        : ''
                    }
                  />
                </FormControl>
                <div className='h-5'>
                  <AnimatePresence>
                    {fieldState.error && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <FormMessage />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='password'
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className='relative'>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete='new-password'
                      disabled={isLoading}
                      className={cn(
                        'pr-10',
                        fieldState.error &&
                          'border-destructive focus-visible:ring-destructive'
                      )}
                      {...field}
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => {
                        setIsPasswordFocused(false);
                        field.onBlur();
                      }}
                    />
                    <button
                      type='button'
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className='text-on-surface-variant absolute inset-y-0 right-0 flex items-center pr-3'
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className='h-5 w-5' />
                      ) : (
                        <Eye className='h-5 w-5' />
                      )}
                    </button>
                  </div>
                </FormControl>
                <div className='pt-2'>
                  <AnimatePresence mode='wait'>
                    {isPasswordFocused ? (
                      <PasswordValidationHints
                        key='hints'
                        validationState={passwordValidationState}
                      />
                    ) : (
                      <motion.div
                        key='error'
                        className='min-h-[1.25rem]'
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {fieldState.error && <FormMessage />}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='confirmPassword'
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <div className='relative'>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete='new-password'
                      disabled={isLoading}
                      className={cn(
                        'pr-16',
                        fieldState.error &&
                          'border-destructive focus-visible:ring-destructive'
                      )}
                      {...field}
                    />
                    <AnimatePresence>
                      {matchStatus === 'matching' && (
                        <motion.div
                          className='absolute inset-y-0 right-10 flex items-center'
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                        >
                          <CheckCircle2 size={20} className='text-green-600' />
                        </motion.div>
                      )}
                      {matchStatus === 'mismatch' && (
                        <motion.div
                          className='absolute inset-y-0 right-10 flex items-center'
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                        >
                          <XCircle size={20} className='text-destructive' />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <button
                      type='button'
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className='text-on-surface-variant absolute inset-y-0 right-0 flex items-center pr-3'
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className='h-5 w-5' />
                      ) : (
                        <Eye className='h-5 w-5' />
                      )}
                    </button>
                  </div>
                </FormControl>
                <div className='h-5'>
                  <AnimatePresence>
                    {fieldState.error && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <FormMessage />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FormItem>
            )}
          />

          <motion.div variants={itemVariants} className='pt-2'>
            <Button
              type='submit'
              className='w-full'
              size='lg'
              disabled={isLoading}
            >
              {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </motion.div>
        </form>
      </Form>

      <motion.div variants={itemVariants} className='mt-8'>
        <div className='relative'>
          <div
            className='absolute inset-0 flex items-center'
            aria-hidden='true'
          >
            <div className='w-full border-t border-outline-variant' />
          </div>
          <div className='relative flex justify-center text-sm font-medium leading-6'>
            <span className='bg-surface px-6 text-muted-foreground'>
              Or sign up with
            </span>
          </div>
        </div>

        <div className='mt-6 grid grid-cols-2 gap-4'>
          <Button
            variant='outline'
            disabled={isLoading}
            onClick={handleGoogleSignup}
            type='button'
            size='lg'
          >
            <svg className='mr-2 h-4 w-4' viewBox='0 0 24 24'>
              <path
                fill='#4285F4'
                d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
              />
              <path
                fill='#34A853'
                d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
              />
              <path
                fill='#FBBC05'
                d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
              />
              <path
                fill='#EA4335'
                d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
              />
            </svg>
            Google
          </Button>
          <Button
            variant='outline'
            disabled={isLoading}
            onClick={handleDiscordSignup}
            type='button'
            size='lg'
          >
            <svg className='mr-2 h-4 w-4' viewBox='0 0 24 24' fill='#5865F2'>
              <path d='M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z' />
            </svg>
            Discord
          </Button>
        </div>
      </motion.div>
    </AuthLayout>
  );
};

export default SignupPage;
