import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

const ImageCarousel = ({
  images = [],
  autoplay = true,
  interval = 5000,
  className,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!autoplay || images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images, autoplay, interval]);

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const goToPrevious = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + images.length) % images.length
    );
  };

  if (images.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-xl bg-surface-variant',
          className
        )}
      >
        <p className='text-on-surface-variant'>No images to display</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative w-full overflow-hidden rounded-xl shadow-2xl',
        className
      )}
    >
      <AnimatePresence initial={false}>
        <motion.img
          key={currentIndex}
          src={images[currentIndex]}
          alt={`Slide ${currentIndex + 1}`}
          className='absolute inset-0 h-full w-full rounded-xl object-cover'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
      </AnimatePresence>

      {images.length > 1 && (
        <>
          <Button
            variant='ghost'
            size='icon'
            onClick={goToPrevious}
            className='absolute left-4 top-1/2 z-10 -translate-y-1/2 bg-background/50 text-foreground opacity-0 transition-opacity hover:bg-background/80 group-hover:opacity-100'
            aria-label='Previous image'
          >
            <ChevronLeft className='h-6 w-6' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            onClick={goToNext}
            className='absolute right-4 top-1/2 z-10 -translate-y-1/2 bg-background/50 text-foreground opacity-0 transition-opacity hover:bg-background/80 group-hover:opacity-100'
            aria-label='Next image'
          >
            <ChevronRight className='h-6 w-6' />
          </Button>

          <div className='absolute bottom-4 left-0 right-0 z-10 flex justify-center space-x-2'>
            {images.map((_, index) => (
              <Button
                key={index}
                variant='ghost'
                size='icon'
                onClick={() => setCurrentIndex(index)}
                className={`h-2 w-2 rounded-full p-0 ${
                  index === currentIndex
                    ? 'bg-primary'
                    : 'bg-muted-foreground/50'
                } transition-colors hover:bg-primary`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ImageCarousel;
