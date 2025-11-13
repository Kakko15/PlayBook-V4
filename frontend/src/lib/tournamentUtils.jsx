import { cn } from '@/lib/utils';

export const getGameDetails = (game) => {
  switch (game) {
    case 'basketball':
      return {
        bgColor: 'bg-game-basketball',
        icon: (
          <img
            src='/images/basketball_logo.png'
            alt='Basketball'
            className='h-16 w-16'
          />
        ),
      };
    case 'valorant':
      return {
        bgColor: 'bg-game-valorant',
        icon: (
          <img
            src='/images/valorant_logo.png'
            alt='Valorant'
            className='h-16 w-16'
          />
        ),
      };
    case 'mlbb':
      return {
        bgColor: 'bg-game-mlbb',
        icon: (
          <img
            src='/images/ml_logo.png'
            alt='Mobile Legends'
            className='h-16 w-16'
          />
        ),
      };
    default:
      return {
        bgColor: 'bg-gray-500',
        icon: null,
      };
  }
};

export const formatDateRange = (start, end) => {
  if (!start) return 'Date TBD';

  const startDate = new Date(start);
  const options = { month: 'short', day: 'numeric' };

  if (!end) {
    return `Starts ${startDate.toLocaleDateString(undefined, options)}`;
  }

  const endDate = new Date(end);
  const startStr = startDate.toLocaleDateString(undefined, {
    ...options,
    year:
      startDate.getFullYear() !== endDate.getFullYear() ? 'numeric' : undefined,
  });
  const endStr = endDate.toLocaleDateString(undefined, {
    ...options,
    year: 'numeric',
  });

  return `${startStr} - ${endStr}`;
};

export const getStatus = (startDate) => {
  if (!startDate)
    return { text: 'Pending', color: 'bg-gray-200 text-gray-800' };

  const now = new Date();
  const start = new Date(startDate);

  if (start > now) {
    return { text: 'Upcoming', color: 'bg-yellow-200 text-yellow-800' };
  }

  return { text: 'Ongoing', color: 'bg-green-200 text-green-800' };
};
