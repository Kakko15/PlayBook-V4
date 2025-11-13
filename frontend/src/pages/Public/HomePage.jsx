import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import ImageCarousel from '@/components/ImageCarousel';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
};

const HomePage = () => {
  const carouselImages = [
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=1935',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=2070',
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=2071',
  ];

  return (
    <div className='flex min-h-screen flex-col bg-background'>
      <motion.header
        className='fixed left-0 right-0 top-0 z-20 flex items-center justify-between border-b border-outline-variant bg-background/80 p-4 px-4 backdrop-blur-sm md:px-8'
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <Link to='/' className='group flex items-center gap-2'>
          <Logo className='h-8 w-auto transition-transform group-hover:scale-110' />
          <span className='text-xl font-bold text-foreground transition-colors group-hover:text-primary'>
            PlayBook
          </span>
        </Link>
        <Button asChild variant='ghost'>
          <Link to='/login'>Admin Login</Link>
        </Button>
      </motion.header>

      <main className='mx-auto w-full max-w-7xl flex-1 pt-20'>
        <div className='grid h-full gap-8 lg:grid-cols-2'>
          <motion.div
            className='flex flex-col justify-center p-8 text-center lg:text-left'
            variants={containerVariants}
            initial='hidden'
            animate='show'
          >
            <motion.h1
              variants={itemVariants}
              className='text-5xl font-bold tracking-tighter text-foreground md:text-7xl'
            >
              Tournament Management,
              <br />
              <span className='text-primary'>Reimagined.</span>
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className='mx-auto mt-6 max-w-xl text-lg text-muted-foreground lg:mx-0'
            >
              The all-in-one system for ISU sports and esports. Streamline
              registration, track live stats, and view results all in one place.
            </motion.p>
            <motion.div
              variants={itemVariants}
              className='mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start'
            >
              <Button asChild size='lg' className='w-full sm:w-auto'>
                <Link to='/viewer/all'>
                  View Tournaments
                  <ArrowRight className='ml-2 h-4 w-4' />
                </Link>
              </Button>
              <Button
                asChild
                size='lg'
                variant='outline'
                className='w-full sm:w-auto'
              >
                <Link to='/login'>Admin Dashboard</Link>
              </Button>
            </motion.div>
          </motion.div>

          <div className='relative hidden items-center justify-center p-8 lg:flex'>
            <ImageCarousel
              images={carouselImages}
              className='h-[60vh] max-h-[600px] w-full shadow-2xl'
            />
          </div>
        </div>
      </main>

      <motion.footer
        className='mx-auto flex w-full max-w-7xl flex-col items-center justify-center gap-2 p-6'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <p className='text-sm text-muted-foreground'>Powered by</p>
        <img
          src='/images/isu_logo.png'
          alt='Isabela State University Logo'
          className='h-16 w-16 opacity-70'
        />
      </motion.footer>
    </div>
  );
};

export default HomePage;
