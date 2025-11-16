import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import Icon from '@/components/Icon';
import { motion } from 'framer-motion';

const DeletedPage = () => {
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
          <Icon
            name='sentiment_dissatisfied'
            className='mx-auto text-7xl text-destructive'
          />
        </motion.div>

        <h2 className='mt-6 text-3xl font-bold tracking-tight text-foreground'>
          Account Not Found
        </h2>
        <p className='mt-4 text-base text-muted-foreground'>
          This account may have been deleted by an administrator or the session
          has expired.
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

export default DeletedPage;
