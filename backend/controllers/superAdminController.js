import supabase from "../supabaseClient.js";
import { sendApprovalEmail } from "../utils/emailService.js";

const BUCKET_NAME = "backups";
const TABLES_TO_BACKUP = [
  "tournaments",
  "teams",
  "players",
  "matches",
  "match_player_stats",
  "predictions",
  "collaborators",
];

export const getPendingUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, created_at")
      .eq("status", "pending_approval")
      .order("created_at", { ascending: true });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error("Get Pending Users Error:", error.message);
    res.status(500).json({ message: "Error fetching pending users." });
  }
};

export const approveUser = async (req, res) => {
  const { id } = req.params;
  try {
    const { data: user, error } = await supabase
      .from("users")
      .update({ status: "active" })
      .eq("id", id)
      .eq("status", "pending")
      .select("id, name, email")
      .single();

    if (error) throw error;
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found or already approved." });
    }

    await sendApprovalEmail(user.email, user.name);

    await supabase.rpc("log_activity", {
      p_icon: "person_check",
      p_color: "text-blue-600",
      p_title: "User Approved",
      p_description: `Admin ${req.user.email} approved ${user.email}.`,
      p_user_id: user.id,
    });

    res.status(200).json({ message: "User approved and email sent." });
  } catch (error) {
    console.error("Approve User Error:", error.message);
    res.status(500).json({ message: "Error approving user." });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, role, status, created_at, otp_enabled")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error("Get All Users Error:", error.message);
    res.status(500).json({ message: "Error fetching users." });
  }
};

export const manageUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role || !["admin", "super_admin"].includes(role)) {
    return res.status(400).json({ message: "Invalid role specified." });
  }

  if (id === req.user.userId) {
    return res
      .status(403)
      .json({ message: "Super Admins cannot change their own role." });
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .update({ role })
      .eq("id", id)
      .select("id, role")
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: "User not found." });
    }

    res
      .status(200)
      .json({ message: `User role updated to ${role}.`, user: data });
  } catch (error) {
    console.error("Manage User Role Error:", error.message);
    res.status(500).json({ message: "Error updating user role." });
  }
};

export const manageUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !["active", "suspended"].includes(status)) {
    return res
      .status(400)
      .json({ message: 'Invalid status. Must be "active" or "suspended".' });
  }

  if (id === req.user.userId) {
    return res
      .status(403)
      .json({ message: "Super Admins cannot suspend their own account." });
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .update({ status })
      .eq("id", id)
      .select("id, status")
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: "User not found." });
    }

    res
      .status(200)
      .json({ message: `User status updated to ${status}.`, user: data });
  } catch (error) {
    console.error("Manage User Status Error:", error.message);
    res.status(500).json({ message: "Error updating user status." });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;

  if (id === req.user.userId) {
    return res
      .status(403)
      .json({ message: "Super Admins cannot delete their own account." });
  }

  try {
    const { data: user, error } = await supabase
      .from("users")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Delete User Error:", error.message);
    if (error.code === "23503") {
      return res.status(409).json({
        message:
          "Cannot delete user. They are still the owner of a tournament or backup record. Please reassign ownership or delete those records first.",
      });
    }
    res.status(500).json({ message: "Error deleting user." });
  }
};

export const createBackup = async (req, res) => {
  const backupData = {};
  const { userId } = req.user;

  try {
    for (const table of TABLES_TO_BACKUP) {
      const { data, error } = await supabase.from(table).select("*");
      if (error) throw error;
      backupData[table] = data;
    }

    const isoDate = new Date().toISOString();
    const fileName = `playbook-backup-${isoDate}.json`;
    const fileContent = JSON.stringify(backupData);
    const storagePath = `backups/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileContent, {
        contentType: "application/json",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { error: dbError } = await supabase.from("data_backups").insert({
      created_by: userId,
      file_name: fileName,
      storage_path: storagePath,
    });

    if (dbError) throw dbError;

    res.status(201).json({ message: "Backup created successfully." });
  } catch (error) {
    console.error("Create Backup Error:", error.message);
    res.status(500).json({ message: "Error creating backup." });
  }
};

export const getBackups = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("data_backups")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error("Get Backups Error:", error.message);
    res.status(500).json({ message: "Error fetching backups." });
  }
};

export const restoreBackup = async (req, res) => {
  const { storagePath } = req.body;
  if (!storagePath) {
    return res.status(400).json({ message: "Storage path is required." });
  }

  try {
    const { data: file, error: downloadError } = await supabase.storage
      .from(BUCKET_NAME)
      .download(storagePath);

    if (downloadError) throw downloadError;

    const backupData = JSON.parse(await file.text());

    for (const table of TABLES_TO_BACKUP) {
      await supabase
        .from(table)
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
    }

    for (const table of TABLES_TO_BACKUP) {
      const data = backupData[table];
      if (data && data.length > 0) {
        const { error: insertError } = await supabase.from(table).insert(data);
        if (insertError) {
          throw new Error(
            `Failed to restore table ${table}: ${insertError.message}`
          );
        }
      }
    }

    res.status(200).json({ message: "Database restored successfully." });
  } catch (error) {
    console.error("Restore Backup Error:", error.message);
    res.status(500).json({ message: "Error restoring backup." });
  }
};
