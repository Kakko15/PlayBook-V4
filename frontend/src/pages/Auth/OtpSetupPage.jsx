import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Logo from '@/components/Logo';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const OtpSetupPage = () => {
  const [secret, setSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const generateSecret = async () => {
      try {
        const data = await api.generateOtp();
        setSecret(data.secret);
        setQrCodeUrl(data.qrCodeUrl);
      } catch (error) {
        toast.error('Failed to generate 2FA secret. Please refresh.');
      } finally {
        setIsLoading(false);
      }
    };
    generateSecret();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (token.length !== 6) {
      toast.error('Please enter a 6-digit code.');
      return;
    }
    setIsVerifying(true);
    try {
      await api.verifyOtpSetup(token);
      toast.success('2FA enabled successfully!');
      if (user?.role === 'super_admin') {
        navigate('/superadmin');
      } else {
        navigate('/admin');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP code.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-background p-4'>
      <div className='mx-auto w-full max-w-md text-center'>
        <div className='mb-8 flex justify-center'>
          <Logo size='md' />
        </div>
        <h2 className='mt-6 text-3xl font-bold tracking-tight text-foreground'>
          Set Up Two-Factor Authentication
        </h2>
        <p className='mt-4 text-base text-muted-foreground'>
          Scan the QR code with your authenticator app (e.g., Google
          Authenticator) to add PlayBook.
        </p>

        <div className='mt-8'>
          {isLoading ? (
            <div className='flex h-[200px] w-full items-center justify-center'>
              <Loader2 className='h-12 w-12 animate-spin text-primary' />
            </div>
          ) : (
            <div className='flex flex-col items-center gap-4'>
              <div className='rounded-lg bg-white p-4'>
                <QRCode value={qrCodeUrl} size={176} />
              </div>
              <p className='text-sm text-muted-foreground'>
                Or enter this key manually:
              </p>
              <code className='rounded-md bg-muted px-3 py-1 font-mono text-sm'>
                {secret}
              </code>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className='mt-8 space-y-6'>
          <div className='text-left'>
            <Label htmlFor='token'>Verification Code</Label>
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
                disabled={isVerifying || isLoading}
                maxLength={6}
                className='text-center text-lg tracking-[0.3em]'
              />
            </div>
          </div>

          <div>
            <Button
              type='submit'
              className='w-full'
              disabled={isVerifying || isLoading}
            >
              {isVerifying && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {isVerifying ? 'Verifying...' : 'Verify & Enable'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OtpSetupPage;
