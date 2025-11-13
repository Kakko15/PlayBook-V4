import React from 'react';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
};

const AuthLayout = ({ children, title, description }) => {
  return (
    <div className='flex min-h-screen items-center justify-center bg-background p-4'>
      <motion.div
        layoutId='auth-card-container'
        className='w-full max-w-md overflow-hidden rounded-2xl border border-outline-variant bg-surface'
        variants={containerVariants}
        initial='hidden'
        animate='show'
      >
        <div className='p-8'>
          <motion.div variants={itemVariants} className='flex justify-start'>
            <Logo />
          </motion.div>
          <motion.div variants={itemVariants} className='mt-6'>
            <h2 className='text-2xl font-bold tracking-tight text-foreground'>
              {title}
            </h2>
            <p className='mt-2 text-sm text-muted-foreground'>{description}</p>
          </motion.div>

          <motion.div variants={itemVariants} className='mt-8'>
            {children}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthLayout;
