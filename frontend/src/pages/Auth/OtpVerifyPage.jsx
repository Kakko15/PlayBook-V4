import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Logo from '@/components/Logo';
import { Loader2, Mail, Smartphone, ArrowRight, Clock } from 'lucide-react';
import { OTP_LENGTH } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const OtpVerifyPage = () => {
  const [otp, setOtp] = useState(new Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const inputRefs = useRef([]);
  const [method, setMethod] = useState('totp'); // 'totp' or 'email'
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0); // seconds remaining
  const timerRef = useRef(null);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('playbook-otp-email');
    if (!storedEmail) {
      navigate('/login', { replace: true });
    } else {
      setEmail(storedEmail);
    }
  }, [navigate]);

  useEffect(() => {
    if (email && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [email]);

  // Timer countdown effect
  useEffect(() => {
    if (timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeRemaining]);

  const sendEmailCode = async () => {
    if (!email) return;
    setIsSendingEmail(true);
    try {
      await api.generateOtpEmail(email);
      toast.success('Code sent to your email!');
      setEmailSent(true);
      setTimeRemaining(600); // 10 minutes in seconds
      // Reset OTP input
      setOtp(new Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send code.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const verifyOtp = async (code) => {
    if (code.length !== OTP_LENGTH) {
      return;
    }

    if (!email) {
      toast.error('Session error. Please try logging in again.');
      navigate('/login', { replace: true });
      return;
    }

    setIsLoading(true);
    try {
      const data = await api.verifyOtpLogin(email, code, method);

      if (!data.token || !data.user) {
        toast.error('Invalid response from server');
        setIsLoading(false);
        return;
      }

      localStorage.setItem('playbook-token', data.token);
      localStorage.setItem('playbook-user', JSON.stringify(data.user));
      api.setAuthToken(data.token);

      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`);

      sessionStorage.removeItem('playbook-otp-email');

      const redirectPath =
        data.user.role === 'super_admin' ? '/superadmin' : '/admin';
      window.location.href = redirectPath;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP code.');
      setOtp(new Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    await verifyOtp(code);
  };

  const handleChange = (element, index) => {
    const value = element.value.replace(/[^0-9]/g, '');
    if (!value) return;

    const newOtp = [...otp];
    newOtp[index] = value[value.length - 1];
    setOtp(newOtp);

    const code = newOtp.join('');
    if (code.length === OTP_LENGTH) {
      verifyOtp(code);
    } else if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (otp[index] !== '') {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
    if (paste.length === OTP_LENGTH) {
      const newOtp = paste.split('');
      setOtp(newOtp);
      verifyOtp(paste);
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50 p-4 font-sans'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className='w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-gray-900/5'
      >
        <div className='bg-green-600 p-8 text-center text-white'>
          <div className='mb-4 flex justify-center'>
            <div className='rounded-full bg-white/20 p-3 backdrop-blur-sm'>
              <Logo size='md' className='text-white' />
            </div>
          </div>
          <h2 className='text-2xl font-bold tracking-tight'>Verification</h2>
          <p className='mt-2 text-green-100 opacity-90'>
            Confirm your identity to continue
          </p>
        </div>

        <div className='p-8'>
          {/* Method Toggle (Segmented Button Style) */}
          <div className='mb-8 flex rounded-full bg-gray-100 p-1'>
            <button
              onClick={() => setMethod('totp')}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium transition-all duration-200',
                method === 'totp'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Smartphone className='h-4 w-4' />
              App
            </button>
            <button
              onClick={() => {
                setMethod('email');
                if (!emailSent && method !== 'email') {
                  // Optional: Auto-send logic could go here
                }
              }}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium transition-all duration-200',
                method === 'email'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Mail className='h-4 w-4' />
              Email
            </button>
          </div>

          <div className='mb-6 text-center'>
            <p className='text-sm text-gray-600'>
              {method === 'totp'
                ? 'Enter the 6-digit code from your authenticator app.'
                : 'Enter the 6-digit code sent to your email address.'}
            </p>
          </div>

          {method === 'email' && !emailSent && (
            <div className='mb-6'>
              <Button
                variant='outline'
                onClick={sendEmailCode}
                disabled={isSendingEmail}
                className='w-full rounded-full border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800'
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Sending Code...
                  </>
                ) : (
                  'Send Verification Code'
                )}
              </Button>
            </div>
          )}

          {method === 'email' && emailSent && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={cn(
                'mb-6 rounded-2xl p-4 text-center transition-colors',
                timeRemaining > 0 ? 'bg-green-50' : 'bg-red-50'
              )}
            >
              <p
                className={cn(
                  'text-sm font-medium',
                  timeRemaining > 0 ? 'text-green-800' : 'text-red-800'
                )}
              >
                {timeRemaining > 0 ? (
                  <>Code sent to {email}</>
                ) : (
                  <>Code expired. Please request a new one.</>
                )}
              </p>
              {timeRemaining > 0 && (
                <div className='mt-2 flex items-center justify-center gap-1.5 text-sm font-medium text-green-700'>
                  <Clock className='h-4 w-4' />
                  <span>
                    {Math.floor(timeRemaining / 60)}:
                    {(timeRemaining % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}
              <button
                onClick={sendEmailCode}
                disabled={isSendingEmail}
                className={cn(
                  'mt-1 text-xs font-medium underline underline-offset-2',
                  timeRemaining > 0
                    ? 'text-green-600 decoration-green-600/30 hover:text-green-700'
                    : 'text-red-600 decoration-red-600/30 hover:text-red-700'
                )}
              >
                Resend Code
              </button>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className='space-y-8'>
            <div className='space-y-2'>
              <Label htmlFor='otp-0' className='sr-only'>
                6-Digit Code
              </Label>
              <div
                className='flex justify-center gap-2 sm:gap-3'
                onPaste={handlePaste}
              >
                {otp.map((data, index) => (
                  <Input
                    key={index}
                    id={`otp-${index}`}
                    type='text'
                    inputMode='numeric'
                    pattern='[0-9]'
                    maxLength={1}
                    value={data}
                    onChange={(e) => handleChange(e.target, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onFocus={(e) => e.target.select()}
                    ref={(el) => (inputRefs.current[index] = el)}
                    disabled={isLoading || !email}
                    className={cn(
                      'h-12 w-10 rounded-xl border-gray-200 bg-gray-50 text-center text-xl font-semibold text-gray-900 transition-all focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-500/20 sm:h-14 sm:w-12 sm:text-2xl',
                      isLoading && 'opacity-50'
                    )}
                    autoFocus={index === 0}
                    autoComplete='off'
                  />
                ))}
              </div>
            </div>

            <Button
              type='submit'
              className='group h-12 w-full rounded-full bg-green-600 text-base font-medium text-white shadow-lg shadow-green-600/20 transition-all hover:bg-green-700 hover:shadow-green-600/30 disabled:opacity-70'
              disabled={isLoading || !email || otp.join('').length < OTP_LENGTH}
            >
              {isLoading ? (
                <Loader2 className='mr-2 h-5 w-5 animate-spin' />
              ) : (
                <>
                  Verify & Login
                  <ArrowRight className='ml-2 h-4 w-4 transition-transform group-hover:translate-x-1' />
                </>
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default OtpVerifyPage;
