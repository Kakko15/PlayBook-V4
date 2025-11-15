import { motion } from 'framer-motion';
import Logo from '@/components/Logo';
import { containerVariants, slideUpVariants } from '@/lib/animations';

const AuthLayout = ({ children, title, description }) => {
  return (
    <div
      className='relative z-10 flex min-h-screen items-center justify-center p-4'
      style={{ background: 'transparent' }}
    >
      <motion.div
        className='relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-outline-variant bg-surface shadow-2xl'
        variants={containerVariants}
        initial='hidden'
        animate='show'
      >
        <div className='p-8'>
          <motion.div variants={slideUpVariants} className='flex justify-start'>
            <Logo />
          </motion.div>
          <motion.div variants={slideUpVariants} className='mt-6'>
            <h2 className='text-2xl font-bold tracking-tight text-foreground'>
              {title}
            </h2>
            <p className='mt-2 text-sm text-muted-foreground'>{description}</p>
          </motion.div>

          <motion.div variants={slideUpVariants} className='mt-8'>
            {children}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthLayout;
