import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Button, buttonVariants } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alertDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdownMenu';
import Icon from '@/components/Icon';
import DepartmentModal from '@/components/DepartmentModal';
import SortableTable from '@/components/ui/SortableTable';

const DepartmentManagementPage = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [deptToDelete, setDeptToDelete] = useState(null);

  const fetchDepartments = useCallback(async () => {
    try {
      const data = await api.getDepartments();
      setDepartments(data);
    } catch (error) {
      toast.error('Failed to fetch departments');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleAddClick = () => {
    setSelectedDept(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (dept) => {
    setSelectedDept(dept);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (dept) => {
    setDeptToDelete(dept);
    setIsAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!deptToDelete) return;
    setActionLoading(deptToDelete.id);
    setIsAlertOpen(false);
    try {
      await api.deleteDepartment(deptToDelete.id);
      toast.success('Department deleted successfully');
      fetchDepartments();
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to delete department'
      );
    } finally {
      setActionLoading(null);
      setDeptToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  const columns = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      filterable: true,
      renderCell: (row) => (
        <span className='font-medium text-foreground'>{row.name}</span>
      ),
    },
    {
      key: 'acronym',
      header: 'Acronym',
      sortable: true,
      filterable: true,
      renderCell: (row) => (
        <span className='text-muted-foreground'>{row.acronym}</span>
      ),
    },
    {
      key: 'elo_rating',
      header: 'Elo Rating',
      sortable: true,
      renderCell: (row) => (
        <span className='text-muted-foreground'>{row.elo_rating}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      cellClassName: 'text-right',
      renderCell: (row) => (
        <div className='flex items-center justify-end'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8'
                disabled={actionLoading === row.id}
              >
                {actionLoading === row.id ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <Icon name='more_horiz' className='text-lg' />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={() => handleEditClick(row)}>
                <Icon name='edit' className='mr-2 text-lg' />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteClick(row)}
                className='text-destructive focus:bg-destructive-container focus:text-destructive'
              >
                <Icon name='delete' className='mr-2 text-lg' />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className='p-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-foreground'>
            Department Management
          </h1>
          <p className='mt-2 text-muted-foreground'>
            Add, edit, or remove university departments.
          </p>
        </div>
        <Button onClick={handleAddClick}>
          <Icon name='add' className='mr-2' />
          Add Department
        </Button>
      </div>

      <div className='mt-8'>
        <h2 className='mb-4 text-xl font-semibold text-foreground'>
          All Departments ({departments.length})
        </h2>
        <SortableTable
          data={departments}
          columns={columns}
          defaultSortKey='name'
          defaultSortOrder='asc'
          emptyMessage='No departments found'
        />
      </div>

      <DepartmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchDepartments}
        department={selectedDept}
      />

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the department "
              <span className='font-medium text-foreground'>
                {deptToDelete?.name}
              </span>
              ". This action cannot be undone and may fail if teams are
              associated with it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className={buttonVariants({ variant: 'destructive' })}
            >
              Yes, Delete Department
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DepartmentManagementPage;
