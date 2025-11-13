import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Logo from '@/components/Logo';
import { Loader2, Eye, EyeOff, XCircle, CheckCircle2 } from 'lucide-react';
import PasswordValidationHints from '@/components/PasswordValidationHints';
import { motion, AnimatePresence } from 'framer-motion';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [step, setStep] = useState(token ? 'reset' : 'request');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const navigate = useNavigate();

  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    specialChar: false,
  });

  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [matchStatus, setMatchStatus] = useState('idle');

  useEffect(() => {
    setPasswordValidation({
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      specialChar: /[^A-Za-z0-9]/.test(password),
    });
  }, [password]);

  const allRulesMet = Object.values(passwordValidation).every(Boolean);

  useEffect(() => {
    if (confirmPassword.length > 0 && allRulesMet) {
      if (password === confirmPassword) {
        setMatchStatus('matching');
      } else {
        setMatchStatus('mismatch');
      }
    } else {
      setMatchStatus('idle');
    }
  }, [password, confirmPassword, allRulesMet]);

  useEffect(() => {
    const validateToken = async () => {
      if (token) {
        setIsLoading(true);
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/auth/password/validate-token`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token }),
            }
          );
          if (response.ok) {
            setIsTokenValid(true);
          } else {
            throw new Error('Invalid token');
          }
        } catch (error) {
          toast.error('Invalid or expired password reset link.');
          navigate('/reset-password');
        } finally {
          setIsLoading(false);
        }
      }
    };
    validateToken();
  }, [token, navigate]);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/password/request-reset`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      );
      const data = await response.json();
      toast.success(data.message);
      setStep('requested');
    } catch (error) {
      toast.error('An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (matchStatus !== 'matching') {
      toast.error('Passwords do not match.');
      return;
    }
    if (!allRulesMet) {
      toast.error('Password does not meet requirements.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/password/reset`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, newPassword: password }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        navigate('/login');
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    if (isLoading && step === 'reset') {
      return (
        <Loader2 className='mx-auto h-12 w-12 animate-spin text-primary' />
      );
    }

    switch (step) {
      case 'request':
        return (
          <>
            <h2 className='mt-8 text-2xl font-bold leading-9 tracking-tight text-foreground'>
              Reset your password
            </h2>
            <p className='mt-2 text-sm leading-6 text-muted-foreground'>
              Enter your email and we'll send you a link to get back into your
              account.
            </p>
            <form onSubmit={handleRequestSubmit} className='mt-10 space-y-6'>
              <div>
                <Label htmlFor='email'>Email address</Label>
                <div className='mt-2'>
                  <Input
                    id='email'
                    name='email'
                    type='email'
                    autoComplete='email'
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div>
                <Button type='submit' className='w-full' disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  )}
                  {isLoading ? 'Sending...' : 'Send reset link'}
                </Button>
              </div>
            </form>
          </>
        );
      case 'requested':
        return (
          <>
            <h2 className='mt-8 text-2xl font-bold leading-9 tracking-tight text-foreground'>
              Check your email
            </h2>
            <p className='mt-4 text-base text-muted-foreground'>
              We sent a password reset link to <br />
              <strong className='text-foreground'>{email}</strong>
            </p>
            <p className='mt-4 text-sm text-muted-foreground'>
              Didn't receive the email? Check your spam folder, or try again.
            </p>
            <Button variant='link' onClick={() => setStep('request')}>
              Request another link
            </Button>
          </>
        );
      case 'reset':
        if (!isTokenValid)
          return (
            <Loader2 className='mx-auto h-12 w-12 animate-spin text-primary' />
          );
        return (
          <>
            <h2 className='mt-8 text-2xl font-bold leading-9 tracking-tight text-foreground'>
              Create a new password
            </h2>
            <p className='mt-2 text-sm leading-6 text-muted-foreground'>
              Your new password must be at least 8 characters long and include a
              number, a special character, and upper/lowercase letters.
            </p>
            <form onSubmit={handleResetSubmit} className='mt-10 space-y-6'>
              <div>
                <Label htmlFor='password'>New Password</Label>
                <div className='relative mt-2'>
                  <Input
                    id='password'
                    name='password'
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    disabled={isLoading}
                    className='pr-10'
                  />
                  <button
                    type='button'
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground'
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className='h-5 w-5' />
                    ) : (
                      <Eye className='h-5 w-5' />
                    )}
                  </button>
                </div>
                <div className='pt-2'>
                  <AnimatePresence mode='wait'>
                    {isPasswordFocused ? (
                      <PasswordValidationHints
                        key='hints'
                        validationState={passwordValidation}
                      />
                    ) : (
                      <motion.div
                        key='error'
                        className='min-h-[1.25rem]'
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      ></motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div>
                <Label htmlFor='confirmPassword'>Confirm New Password</Label>
                <div className='relative mt-2'>
                  <Input
                    id='confirmPassword'
                    name='confirmPassword'
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className='pr-16'
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
                    className='absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground'
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className='h-5 w-5' />
                    ) : (
                      <Eye className='h-5 w-5' />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <Button
                  type='submit'
                  className='w-full'
                  disabled={
                    isLoading || !allRulesMet || matchStatus !== 'matching'
                  }
                >
                  {isLoading && (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  )}
                  {isLoading ? 'Resetting...' : 'Set new password'}
                </Button>
              </div>
            </form>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-background p-4'>
      <div className='mx-auto w-full max-w-sm'>
        <div className='mb-8 flex justify-center'>
          <Logo size='md' />
        </div>
        {renderStep()}
        <div className='mt-8 text-center'>
          <Link
            to='/login'
            className='text-sm font-semibold text-primary hover:text-primary/90'
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
