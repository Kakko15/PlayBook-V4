import { useState, useEffect, useRef } from 'react';
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
import { OTP_LENGTH } from '@/lib/constants';
import { navigateAfterLogin } from '@/lib/authUtils';
import { cn } from '@/lib/utils';

const OtpSetupPage = () => {
  const [secret, setSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [otp, setOtp] = useState(new Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const inputRefs = useRef([]);

  useEffect(() => {
    const generateSecret = async () => {
      try {
        const data = await api.generateOtp();
        setSecret(data.secret);
        setQrCodeUrl(data.qrCodeUrl);
      } catch (error) {
        const status = error.response?.status;
        if (status !== 401 && status !== 403) {
          toast.error('Failed to generate 2FA secret. Please refresh.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    generateSecret();
  }, []);

  useEffect(() => {
    if (!isLoading && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [isLoading]);

  const verifyOtp = async (code) => {
    if (code.length !== OTP_LENGTH) return;

    setIsVerifying(true);
    try {
      await api.verifyOtpSetup(code);

      const updatedUser = { ...user, otp_enabled: true };
      setUser(updatedUser);
      localStorage.setItem('playbook-user', JSON.stringify(updatedUser));

      toast.success('2FA enabled successfully!');
      navigateAfterLogin(user, navigate);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP code.');
      setOtp(new Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
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
              {qrCodeUrl && qrCodeUrl.length < 2953 ? (
                <div className='rounded-lg bg-white p-4'>
                  <QRCode value={qrCodeUrl} size={200} level='L' />
                </div>
              ) : (
                <div className='rounded-lg bg-muted p-8 text-center'>
                  <p className='text-sm text-muted-foreground'>
                    QR code unavailable. Please use the manual key below.
                  </p>
                </div>
              )}
              <p className='text-sm text-muted-foreground'>
                {qrCodeUrl && qrCodeUrl.length < 2953
                  ? 'Or enter this key manually:'
                  : 'Enter this key manually:'}
              </p>
              <code className='rounded-md bg-muted px-3 py-1 font-mono text-sm'>
                {secret}
              </code>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className='mt-8 space-y-6'>
          <div className='space-y-2 text-left'>
            <Label htmlFor='otp-0' className='sr-only'>
              Verification Code
            </Label>
            <div className='flex justify-center gap-2' onPaste={handlePaste}>
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
                  disabled={isVerifying || isLoading}
                  className={cn(
                    'h-14 w-12 rounded-lg text-center text-2xl font-semibold',
                    (isVerifying || isLoading) && 'opacity-50'
                  )}
                  autoFocus={index === 0}
                />
              ))}
            </div>
          </div>

          <div>
            <Button
              type='submit'
              className='w-full'
              disabled={
                isVerifying || isLoading || otp.join('').length < OTP_LENGTH
              }
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
