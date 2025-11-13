import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import Loader from '@/components/Loader';
import api from '@/lib/api';

const DiscordCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const handleDiscordCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        toast.error('Discord authentication cancelled.');
        navigate('/login');
        return;
      }

      if (!code) {
        toast.error('No authorization code received.');
        navigate('/login');
        return;
      }

      try {
        const data = await api.discordLogin(code);

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
          toast.success(`Welcome, ${data.user.name.split(' ')[0]}!`);

          if (data.user.role === 'super_admin') {
            navigate('/superadmin', { replace: true });
          } else {
            navigate('/admin', { replace: true });
          }
        }
      } catch (error) {
        toast.error(
          error.response?.data?.message || 'Discord authentication failed.'
        );
        navigate('/login');
      }
    };

    handleDiscordCallback();
  }, [searchParams, navigate, setUser]);

  return <Loader />;
};

export default DiscordCallbackPage;
