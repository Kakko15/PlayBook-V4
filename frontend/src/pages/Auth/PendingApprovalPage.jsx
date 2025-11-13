import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Hourglass } from 'lucide-react';
import { motion } from 'framer-motion';

const PendingApprovalPage = () => {
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
          animate={{ rotate: [0, 15, -10, 15, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Hourglass className='mx-auto h-16 w-16 text-primary' />
        </motion.div>

        <h2 className='mt-6 text-3xl font-bold tracking-tight text-foreground'>
          Registration Submitted
        </h2>
        <p className='mt-4 text-base text-muted-foreground'>
          Thank you for signing up! Your account is now pending approval from a
          Super Admin. You will be notified via email once your account has been
          approved.
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

export default PendingApprovalPage;
