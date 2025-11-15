import { cn } from '@/lib/utils';

export default function Logo({ className, ...props }) {
  return (
    <img
      src='/playbook_logo.png'
      alt='PlayBook Logo'
      className={cn('h-10 w-auto', className)}
      {...props}
    />
  );
}
