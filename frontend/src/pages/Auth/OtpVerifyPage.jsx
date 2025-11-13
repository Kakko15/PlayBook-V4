import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Logo from '@/components/Logo';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const OtpVerifyPage = () => {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const { completeOtpLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('playbook-otp-email');
    if (!storedEmail) {
      navigate('/login', { replace: true });
    } else {
      setEmail(storedEmail);
    }
  }, [navigate]);

  if (!email) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (token.length !== 6) {
      toast.error('Please enter a 6-digit code.');
      return;
    }
    setIsLoading(true);
    try {
      const data = await api.verifyOtpLogin(email, token);
      completeOtpLogin(data.token, data.user);

      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`);
      if (data.user.role === 'super_admin') {
        navigate('/superadmin', { replace: true });
      } else {
        navigate('/admin', { replace: true });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-background p-4'>
      <div className='mx-auto w-full max-w-sm text-center'>
        <div className='mb-8 flex justify-center'>
          <Logo size='md' />
        </div>
        <h2 className='mt-6 text-3xl font-bold tracking-tight text-foreground'>
          Two-Factor Verification
        </h2>
        <p className='mt-4 text-base text-muted-foreground'>
          Enter the 6-digit code from your authenticator app for {email}.
        </p>

        <form onSubmit={handleSubmit} className='mt-8 space-y-6'>
          <div className='text-left'>
            <Label htmlFor='token'>6-Digit Code</Label>
            <div className='mt-2'>
              <Input
                id='token'
                name='token'
                type='text'
                inputMode='numeric'
                pattern='[0-9]*'
                autoComplete='one-time-code'
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={isLoading}
                maxLength={6}
                className='text-center text-2xl tracking-[0.3em]'
              />
            </div>
          </div>

          <div>
            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {isLoading ? 'Verifying...' : 'Verify'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OtpVerifyPage;
