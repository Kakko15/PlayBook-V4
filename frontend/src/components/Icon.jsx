import { cn } from '@/lib/utils';

/**
 * Renders a Google Material Symbol.
 * Find icon names at: https://fonts.google.com/icons
 */
const Icon = ({ name, className, ...props }) => {
  return (
    <span
      className={cn('material-symbols-rounded select-none', className)}
      {...props}
    >
      {name}
    </span>
  );
};

export default Icon;
