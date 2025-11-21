import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import Icon from '@/components/Icon';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const formatTimeAgo = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return `${Math.floor(interval)}y ago`;
  interval = seconds / 2592000;
  if (interval > 1) return `${Math.floor(interval)}mo ago`;
  interval = seconds / 86400;
  if (interval > 1) return `${Math.floor(interval)}d ago`;
  interval = seconds / 3600;
  if (interval > 1) return `${Math.floor(interval)}h ago`;
  interval = seconds / 60;
  if (interval > 1) return `${Math.floor(interval)}m ago`;
  return `${Math.floor(seconds)}s ago`;
};

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const ActivityItem = ({ item, onAction }) => (
  <motion.div
    className='flex items-start gap-3 border-b border-border p-4 last:border-0'
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-surface-variant'>
      <Icon name={item.icon} className={cn('text-xl', item.color)} />
    </div>
    <div className='flex-1'>
      <p className='text-sm font-medium text-foreground'>{item.title}</p>
      <p className='text-sm text-muted-foreground'>{item.description}</p>
      <p className='text-xs text-muted-foreground'>
        {formatTimeAgo(item.created_at)}
      </p>
    </div>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='h-8 w-8'>
          <Icon name='more_vert' className='text-muted-foreground' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onAction('view', item)}>
          <Icon name='visibility' className='mr-2 h-4 w-4' />
          View Details
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </motion.div>
);

const ActivityLogPage = () => {
  const [activity, setActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const scrollContainerRef = useRef(null);

  const fetchAllActivity = async (page, limit) => {
    setIsLoading(true);
    try {
      const response = await api.getAllActivity(page, limit);
      // Handle both old array format (if API hasn't updated yet) and new object format
      if (Array.isArray(response)) {
        setActivity(response);
      } else {
        setActivity(response.data);
        setPagination(response.pagination);
      }
    } catch (error) {
      toast.error('Failed to load activity log.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllActivity(pagination.page, pagination.limit);
    // Scroll to top when page changes
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [pagination.page, pagination.limit]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleLimitChange = (newLimit) => {
    setPagination((prev) => ({ ...prev, limit: parseInt(newLimit), page: 1 }));
  };

  const handleAction = (action, item) => {
    if (action === 'view') {
      setSelectedItem(item);
      setIsDetailsOpen(true);
    }
  };

  return (
    <div className='p-8'>
      <h1 className='text-3xl font-bold text-foreground'>Full Activity Log</h1>
      <p className='mt-2 text-muted-foreground'>
        A chronological log of all system and user activities.
      </p>

      <div className='mt-8 flex flex-col gap-4'>
        <div className='rounded-lg border border-border bg-card'>
          {isLoading ? (
            <div className='flex h-64 items-center justify-center'>
              <Loader2 className='h-8 w-8 animate-spin text-primary' />
            </div>
          ) : activity.length === 0 ? (
            <div className='flex h-64 flex-col items-center justify-center'>
              <Icon
                name='notifications_off'
                className='text-5xl text-on-surface-variant'
              />
              <p className='mt-2 text-on-surface-variant'>No activity found.</p>
            </div>
          ) : (
            <>
              <div
                ref={scrollContainerRef}
                className='max-h-[65vh] overflow-y-auto'
              >
                {activity.map((item) => (
                  <ActivityItem
                    key={item.id}
                    item={item}
                    onAction={handleAction}
                  />
                ))}
              </div>

              <div className='border-t border-border p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <p className='text-sm text-muted-foreground'>
                      Rows per page:
                    </p>
                    <Select
                      value={pagination.limit.toString()}
                      onValueChange={handleLimitChange}
                    >
                      <SelectTrigger className='h-8 w-[70px]'>
                        <SelectValue placeholder={pagination.limit} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='10'>10</SelectItem>
                        <SelectItem value='20'>20</SelectItem>
                        <SelectItem value='50'>50</SelectItem>
                        <SelectItem value='100'>100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='flex items-center gap-4'>
                    <p className='text-sm text-muted-foreground'>
                      Page {pagination.page} of {pagination.totalPages}
                    </p>
                    <Pagination className='mx-0 w-auto'>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() =>
                              pagination.page > 1 &&
                              handlePageChange(pagination.page - 1)
                            }
                            className={
                              pagination.page === 1
                                ? 'pointer-events-none opacity-50'
                                : 'cursor-pointer'
                            }
                          />
                        </PaginationItem>

                        {/* First Page */}
                        {pagination.totalPages > 0 && (
                          <PaginationItem>
                            <PaginationLink
                              isActive={pagination.page === 1}
                              onClick={() => handlePageChange(1)}
                              className='cursor-pointer'
                            >
                              1
                            </PaginationLink>
                          </PaginationItem>
                        )}

                        {/* Start Ellipsis */}
                        {pagination.page > 3 && pagination.totalPages > 5 && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}

                        {/* Middle Pages */}
                        {Array.from(
                          { length: 3 },
                          (_, i) => pagination.page - 1 + i
                        )
                          .filter(
                            (p) => p > 1 && p < pagination.totalPages && p > 0
                          )
                          .map((p) => (
                            <PaginationItem key={p}>
                              <PaginationLink
                                isActive={pagination.page === p}
                                onClick={() => handlePageChange(p)}
                                className='cursor-pointer'
                              >
                                {p}
                              </PaginationLink>
                            </PaginationItem>
                          ))}

                        {/* End Ellipsis */}
                        {pagination.page < pagination.totalPages - 2 &&
                          pagination.totalPages > 5 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}

                        {/* Last Page */}
                        {pagination.totalPages > 1 && (
                          <PaginationItem>
                            <PaginationLink
                              isActive={
                                pagination.page === pagination.totalPages
                              }
                              onClick={() =>
                                handlePageChange(pagination.totalPages)
                              }
                              className='cursor-pointer'
                            >
                              {pagination.totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        )}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              pagination.page < pagination.totalPages &&
                              handlePageChange(pagination.page + 1)
                            }
                            className={
                              pagination.page === pagination.totalPages
                                ? 'pointer-events-none opacity-50'
                                : 'cursor-pointer'
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activity Details</DialogTitle>
            <DialogDescription>
              Full details for this activity event.
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className='grid gap-4 py-4'>
              <div className='grid grid-cols-4 items-center gap-4'>
                <span className='font-medium'>Event:</span>
                <span className='col-span-3'>{selectedItem.title}</span>
              </div>
              <div className='grid grid-cols-4 items-center gap-4'>
                <span className='font-medium'>Description:</span>
                <span className='col-span-3'>{selectedItem.description}</span>
              </div>
              <div className='grid grid-cols-4 items-center gap-4'>
                <span className='font-medium'>Time:</span>
                <span className='col-span-3'>
                  {new Date(selectedItem.created_at).toLocaleString()}
                </span>
              </div>
              <div className='grid grid-cols-4 items-center gap-4'>
                <span className='font-medium'>Type:</span>
                <span className='col-span-3 capitalize'>
                  {selectedItem.type || 'General'}
                </span>
              </div>
              {/* Add more fields here if available in your schema */}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActivityLogPage;
