import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Ban } from 'lucide-react';
import { motion } from 'framer-motion';

const SuspendedPage = () => {
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
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Ban className='mx-auto h-16 w-16 text-destructive' />
        </motion.div>

        <h2 className='mt-6 text-3xl font-bold tracking-tight text-foreground'>
          Account Suspended
        </h2>
        <p className='mt-4 text-base text-muted-foreground'>
          Your account has been suspended by an administrator. If you believe
          this is a mistake, please contact support or your Super Admin.
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

export default SuspendedPage;
