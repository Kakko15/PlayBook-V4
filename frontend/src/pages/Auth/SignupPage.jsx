import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import PasswordValidationHints from '@/components/PasswordValidationHints';
import PasswordConfirmInput from '@/components/PasswordConfirmInput';
import AuthLayout from '@/components/AuthLayout';
import OAuthButtons from '@/components/OAuthButtons';
import ParticleBackground from '@/components/ParticleBackground';
import {
  usePasswordValidation,
  usePasswordMatch,
} from '@/hooks/usePasswordValidation';
import { RECAPTCHA_SITE_KEY, MIN_PASSWORD_LENGTH } from '@/lib/constants';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

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
  const { signup } = useAuth();
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);

  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
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

  const { validationState: passwordValidationState, allRulesMet } =
    usePasswordValidation(watchedPassword);
  const matchStatus = usePasswordMatch(
    watchedPassword,
    watchedConfirmPassword,
    allRulesMet
  );

  const onSubmit = async (values) => {
    const recaptchaToken = recaptchaRef.current?.getValue();

    if (!recaptchaToken) {
      toast.error('Please complete the reCAPTCHA verification.');
      return;
    }

    setIsLoading(true);

    try {
      const name = `${values.firstName} ${values.lastName}`;
      const data = await signup(
        name,
        values.email,
        values.password,
        recaptchaToken
      );
      toast.success(data.message);
      navigate('/check-email');
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred.');
      recaptchaRef.current?.reset();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ParticleBackground numParticles={60} />
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
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4'
            noValidate
          >
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='firstName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete='given-name'
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
                name='lastName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete='family-name'
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete='email'
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
                        className='pr-10'
                        aria-invalid={!!fieldState.error}
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
                        className='absolute inset-y-0 right-0 flex items-center pr-3 text-on-surface-variant'
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
                  <FormMessage />
                  <div className='min-h-[1.25rem] pt-2'>
                    <AnimatePresence mode='wait'>
                      {isPasswordFocused && (
                        <PasswordValidationHints
                          key='hints'
                          validationState={passwordValidationState}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='confirmPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <PasswordConfirmInput
                      {...field}
                      showPassword={showPassword}
                      onTogglePassword={() => setShowPassword(!showPassword)}
                      matchStatus={matchStatus}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex justify-center pt-4'>
              <ReCAPTCHA ref={recaptchaRef} sitekey={RECAPTCHA_SITE_KEY} />
            </div>

            <div className='pt-2'>
              <Button
                type='submit'
                className='w-full'
                size='lg'
                disabled={isLoading}
              >
                {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
            </div>
          </form>
        </Form>

        <div className='mt-8'>
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

          <OAuthButtons disabled={isLoading} from='signup' />
        </div>
      </AuthLayout>
    </>
  );
};

export default SignupPage;
