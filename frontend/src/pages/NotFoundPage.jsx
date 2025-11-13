import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';

const NotFoundPage = () => {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center'>
      <div className='mb-8'>
        <Logo size='lg' />
      </div>
      <h1 className='text-9xl font-bold text-primary'>404</h1>
      <h2 className='mt-4 text-4xl font-bold tracking-tight text-foreground'>
        Page Not Found
      </h2>
      <p className='mt-4 text-lg text-muted-foreground'>
        Sorry, we couldn't find the page you're looking for.
      </p>
      <Button asChild className='mt-10' size='lg'>
        <Link to='/'>Go back home</Link>
      </Button>
    </div>
  );
};

export default NotFoundPage;
