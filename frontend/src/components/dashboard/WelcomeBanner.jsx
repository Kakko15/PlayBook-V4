import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import Icon from '@/components/Icon';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
};

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) {
    return {
      greeting: 'Good morning',
      icon: 'waving_hand',
      message: "Here's your overview for today.",
    };
  }
  if (hour < 17) {
    return {
      greeting: 'Good afternoon',
      icon: 'partly_cloudy_day',
      message: 'Keep up the great work.',
    };
  }
  return {
    greeting: 'Good evening',
    icon: 'brightness_3',
    message: 'Wrapping up the day.',
  };
};

const WelcomeBanner = ({ onCreateTournamentClick }) => {
  const { user } = useAuth();
  const firstName = user?.name.split(' ')[0] || 'Admin';
  const { greeting, icon, message } = getGreeting();

  return (
    <motion.div variants={itemVariants}>
      <Card
        className={cn(
          'bg-tertiary-container text-on-tertiary-container relative flex w-full flex-col justify-between overflow-hidden rounded-xl p-6 md:flex-row md:items-end'
        )}
      >
        <Icon
          name={icon}
          className='absolute -right-4 -top-4 text-9xl opacity-10'
        />
        <div className='relative z-10'>
          <h2 className='font-sans text-3xl font-bold'>
            {greeting}, {firstName}!
          </h2>
          <p className='mt-1 text-lg opacity-80'>{message}</p>
        </div>
      </Card>
    </motion.div>
  );
};

export default WelcomeBanner;
