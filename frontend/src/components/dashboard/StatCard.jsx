import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import Icon from '@/components/Icon';
import { cn } from '@/lib/utils';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
};

const StatCard = ({ title, value, icon, colorClass, onColorClass }) => {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Card
        className={cn(
          'flex flex-row items-center justify-between overflow-hidden rounded-xl p-4',
          colorClass
        )}
      >
        <div className='flex flex-col'>
          <CardTitle
            className={cn('text-base font-medium', onColorClass, 'opacity-80')}
          >
            {title}
          </CardTitle>
          <div className={cn('font-sans text-5xl font-bold', onColorClass)}>
            {value}
          </div>
        </div>
        <Icon
          name={icon}
          className={cn('text-4xl', onColorClass, 'opacity-60')}
        />
      </Card>
    </motion.div>
  );
};

export { StatCard };
