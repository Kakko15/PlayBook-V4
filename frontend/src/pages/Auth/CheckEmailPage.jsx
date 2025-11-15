import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { MailCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const CheckEmailPage = () => {
  return (
    <div className='flex min-h-screen items-center justify-center bg-background p-4'>
      <motion.div
        className='mx-auto w-full max-w-md text-center'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className='mb-8 flex justify-center'>
          <Logo size='md' />
        </div>

        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <MailCheck className='mx-auto h-16 w-16 text-primary' />
        </motion.div>

        <h2 className='mt-6 text-3xl font-bold tracking-tight text-foreground'>
          Check your email
        </h2>
        <p className='mt-4 text-base text-muted-foreground'>
          We've sent a verification link to your email address. Please click the
          link to continue.
        </p>
        <p className='mt-4 text-sm text-muted-foreground'>
          (Check your spam folder if you don't see it.)
        </p>
        <div className='mt-8'>
          <Button asChild className='w-full'>
            <Link to='/login'>Back to Sign In</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default CheckEmailPage;
