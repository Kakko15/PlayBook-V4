import { motion } from 'framer-motion';
import { XCircle, CheckCircle2 } from 'lucide-react';

const validationListVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

const ValidationItem = ({ valid, text }) => (
  <div
    className={`flex items-center text-sm transition-colors duration-300 ${valid ? 'text-green-600' : 'text-destructive'}`}
  >
    <motion.div
      initial={false}
      animate={{ scale: valid ? [1, 1.2, 1] : 1 }}
      transition={{ duration: 0.3 }}
    >
      {valid ? (
        <CheckCircle2 size={18} className='mr-1.5 flex-shrink-0' />
      ) : (
        <XCircle size={18} className='mr-1.5 flex-shrink-0' />
      )}
    </motion.div>
    {text}
  </div>
);

const PasswordValidationHints = ({ validationState }) => {
  return (
    <motion.div
      key='validation-grid'
      className='grid grid-cols-1 gap-x-4 gap-y-1 pt-2 sm:grid-cols-2'
      variants={validationListVariants}
      initial='hidden'
      animate='show'
      exit='exit'
    >
      <ValidationItem
        valid={validationState.length}
        text='At least 8 characters'
      />
      <ValidationItem
        valid={validationState.uppercase}
        text='One uppercase letter'
      />
      <ValidationItem
        valid={validationState.lowercase}
        text='One lowercase letter'
      />
      <ValidationItem valid={validationState.number} text='One number' />
      <ValidationItem
        valid={validationState.specialChar}
        text='One special character'
      />
    </motion.div>
  );
};

export default PasswordValidationHints;
