import { cn } from '@/lib/utils';

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
