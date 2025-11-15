import { Button } from '@/components/ui/button';
import GoogleIcon from '@/components/icons/GoogleIcon';
import DiscordIcon from '@/components/icons/DiscordIcon';
import { redirectToGoogleOAuth, redirectToDiscordOAuth } from '@/lib/oauth';

const OAuthButtons = ({ disabled = false, from = 'login' }) => {
  const handleGoogleClick = () => redirectToGoogleOAuth(from);
  const handleDiscordClick = () => redirectToDiscordOAuth(from);

  return (
    <div className='mt-6 grid grid-cols-2 gap-4'>
      <Button
        variant='outline'
        disabled={disabled}
        onClick={handleGoogleClick}
        type='button'
        size='lg'
      >
        <GoogleIcon className='mr-2 h-4 w-4' />
        Google
      </Button>
      <Button
        variant='outline'
        disabled={disabled}
        onClick={handleDiscordClick}
        type='button'
        size='lg'
      >
        <DiscordIcon className='mr-2 h-4 w-4' />
        Discord
      </Button>
    </div>
  );
};

export default OAuthButtons;
