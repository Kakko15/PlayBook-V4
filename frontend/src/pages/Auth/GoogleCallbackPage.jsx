import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';

const GoogleCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const handleGoogleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const state = searchParams.get('state');

      if (error) {
        toast.error('Google authentication cancelled.');
        navigate('/login');
        return;
      }

      if (!code) {
        toast.error('No authorization code received.');
        navigate('/login');
        return;
      }

      try {
        const data = await api.googleOAuthLogin(code);

        if (data.requiresApproval) {
          toast.success(data.message);
          navigate('/pending-approval');
          return;
        }

        if (data.otpRequired) {
          sessionStorage.setItem('playbook-otp-email', data.email);
          toast.success('Please verify your 2FA code.');
          navigate('/verify-2fa');
          return;
        }

        if (data.token && data.user) {
          localStorage.setItem('playbook-token', data.token);
          localStorage.setItem('playbook-user', JSON.stringify(data.user));
          api.setAuthToken(data.token);
          setUser(data.user);
          
          const stateData = state ? JSON.parse(decodeURIComponent(state)) : {};
          const welcomeMessage = stateData.from === 'signup' 
            ? `Welcome, ${data.user.name.split(' ')[0]}!`
            : `Welcome back, ${data.user.name.split(' ')[0]}!`;
          
          toast.success(welcomeMessage);

          if (data.user.role === 'super_admin') {
            navigate('/superadmin', { replace: true });
          } else {
            navigate('/admin', { replace: true });
          }
        }
      } catch (error) {
        toast.error(
          error.response?.data?.message || 'Google authentication failed.'
        );
        navigate('/login');
      }
    };

    handleGoogleCallback();
  }, [searchParams, navigate, setUser]);

  return (
    <div className='flex min-h-screen items-center justify-center'>
      <Loader2 className='h-8 w-8 animate-spin text-primary' />
    </div>
  );
};

export default GoogleCallbackPage;
