import supabase from '../supabaseClient.js';
import { sendApprovalEmail } from '../utils/emailService.js';

export const getPendingUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error('Get Pending Users Error:', error.message);
    res.status(500).json({ message: 'Error fetching pending users.' });
  }
};

export const approveUser = async (req, res) => {
  const { id } = req.params;
  try {
    const { data: user, error } = await supabase
      .from('users')
      .update({ status: 'active' })
      .eq('id', id)
      .eq('status', 'pending')
      .select('name, email')
      .single();

    if (error) throw error;
    if (!user) {
      return res
        .status(404)
        .json({ message: 'User not found or already approved.' });
    }

    await sendApprovalEmail(user.email, user.name);

    res.status(200).json({ message: 'User approved and email sent.' });
  } catch (error) {
    console.error('Approve User Error:', error.message);
    res.status(500).json({ message: 'Error approving user.' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, status, created_at, otp_enabled')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error('Get All Users Error:', error.message);
    res.status(500).json({ message: 'Error fetching users.' });
  }
};

export const manageUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role || !['admin', 'super_admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role specified.' });
  }

  if (id === req.user.userId) {
    return res
      .status(403)
      .json({ message: 'Super Admins cannot change their own role.' });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', id)
      .select('id, role')
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res
      .status(200)
      .json({ message: `User role updated to ${role}.`, user: data });
  } catch (error) {
    console.error('Manage User Role Error:', error.message);
    res.status(500).json({ message: 'Error updating user role.' });
  }
};

export const manageUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['active', 'suspended'].includes(status)) {
    return res
      .status(400)
      .json({ message: 'Invalid status. Must be "active" or "suspended".' });
  }

  if (id === req.user.userId) {
    return res
      .status(403)
      .json({ message: 'Super Admins cannot suspend their own account.' });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .update({ status })
      .eq('id', id)
      .select('id, status')
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res
      .status(200)
      .json({ message: `User status updated to ${status}.`, user: data });
  } catch (error) {
    console.error('Manage User Status Error:', error.message);
    res.status(500).json({ message: 'Error updating user status.' });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;

  if (id === req.user.userId) {
    return res
      .status(403)
      .json({ message: 'Super Admins cannot delete their own account.' });
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Delete User Error:', error.message);
    if (error.code === '23503') {
      return res.status(409).json({
        message:
          'Cannot delete user. They are still the owner of a tournament or backup record. Please reassign ownership or delete those records first.',
      });
    }
    res.status(500).json({ message: 'Error deleting user.' });
  }
};

export const createBackup = async (req, res) => {
  res.status(501).json({ message: 'Backup feature not yet implemented.' });
};

export const getBackups = async (req, res) => {
  res.status(501).json({ message: 'Get backups feature not yet implemented.' });
};

export const restoreBackup = async (req, res) => {
  res.status(501).json({ message: 'Restore feature not yet implemented.' });
};