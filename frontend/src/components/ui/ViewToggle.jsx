import { cn } from '@/lib/utils';
import Icon from '@/components/Icon';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const ViewToggle = ({ view, onViewChange }) => {
  const baseStyles =
    'relative inline-flex h-9 items-center justify-center rounded-full transition-colors duration-200 ease-out';
  const activeStyles = 'bg-secondary-container text-on-secondary-container';
  const inactiveStyles = 'text-muted-foreground hover:bg-accent';

  return (
    <TooltipProvider>
      <div className='flex items-center rounded-full border border-outline-variant p-0.5'>
        {/* List Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onViewChange('list')}
              className={cn(
                baseStyles,
                'px-2.5 transition-all duration-300 ease-out',
                view === 'list' ? activeStyles : inactiveStyles
              )}
              aria-label='List view'
              data-state={view === 'list' ? 'active' : 'inactive'}
            >
              <div className='flex items-center gap-1'>
                <AnimatePresence>
                  {view === 'list' && (
                    <motion.span
                      key='check-list'
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className='overflow-hidden'
                    >
                      <Icon name='check' className='text-xl' />
                    </motion.span>
                  )}
                </AnimatePresence>
                <Icon name='format_list_bulleted' className='text-xl' />
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side='bottom'>
            <p>List layout (Alt+V then L)</p>
          </TooltipContent>
        </Tooltip>

        {/* Grid Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onViewChange('grid')}
              className={cn(
                baseStyles,
                'px-2.5 transition-all duration-300 ease-out',
                view === 'grid' ? activeStyles : inactiveStyles
              )}
              aria-label='Grid view'
              data-state={view === 'grid' ? 'active' : 'inactive'}
            >
              <div className='flex items-center gap-1'>
                <AnimatePresence>
                  {view === 'grid' && (
                    <motion.span
                      key='check-grid'
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className='overflow-hidden'
                    >
                      <Icon name='check' className='text-xl' />
                    </motion.span>
                  )}
                </AnimatePresence>
                <Icon name='grid_view' className='text-xl' />
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side='bottom'>
            <p>Grid layout (Alt+V then L)</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default ViewToggle;
