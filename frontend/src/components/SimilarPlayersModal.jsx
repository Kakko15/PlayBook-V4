import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const SimilarPlayersModal = ({ isOpen, onClose, player, game }) => {
  const [similarPlayers, setSimilarPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && player && game) {
      const fetchSimilar = async () => {
        setIsLoading(true);
        try {
          const data = await api.getSimilarPlayers(player.id, game);
          setSimilarPlayers(data);
        } catch (error) {
          toast.error('Failed to find similar players.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchSimilar();
    }
  }, [isOpen, player, game]);

  const getInitials = (name = '') => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>Players Similar to {player?.name}</DialogTitle>
          <DialogDescription>
            Based on normalized player stats (KNN Cosine Similarity).
          </DialogDescription>
        </DialogHeader>
        <div className='mt-4 max-h-80 space-y-3 overflow-y-auto'>
          {isLoading ? (
            <div className='flex h-32 items-center justify-center'>
              <Loader2 className='h-8 w-8 animate-spin text-primary' />
            </div>
          ) : similarPlayers.length === 0 ? (
            <p className='text-center text-muted-foreground'>
              No similar players found. More match data may be needed.
            </p>
          ) : (
            similarPlayers.map((p) => (
              <div
                key={p.id}
                className='flex items-center justify-between rounded-lg border p-3'
              >
                <div className='flex items-center gap-3'>
                  <Avatar>
                    <AvatarImage
                      src={`https://avatar.vercel.sh/${p.name}.png`}
                    />
                    <AvatarFallback>{getInitials(p.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className='font-semibold text-foreground'>{p.name}</p>
                    <p className='text-sm text-muted-foreground'>
                      Archetype: {p.archetype || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className='text-right'>
                  <p className='font-semibold text-primary'>
                    {(p.similarity * 100).toFixed(1)}%
                  </p>
                  <p className='text-xs text-muted-foreground'>Match</p>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimilarPlayersModal;
