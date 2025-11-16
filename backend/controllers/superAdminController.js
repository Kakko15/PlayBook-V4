import supabase from "../supabaseClient.js";
import {
  sendApprovalEmail,
  sendSuspensionEmail,
  sendDeletionEmail,
  sendRejectionEmail,
} from "../utils/emailService.js";

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

export const getPendingUsers = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, created_at")
      .eq("status", "pending_approval")
      .order("created_at", { ascending: true });

    if (error) return next(error);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const approveUser = async (req, res, next) => {
  const { id } = req.params;
  try {
    const { data: user, error } = await supabase
      .from("users")
      .update({ status: "active" })
      .eq("id", id)
      .eq("status", "pending_approval")
      .select("id, name, email")
      .single();

    if (error) return next(error);
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
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, role, status, created_at, otp_enabled")
      .order("created_at", { ascending: false });

    if (error) return next(error);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const manageUserRole = async (req, res, next) => {
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

    if (error) return next(error);
    if (!data) {
      return res.status(404).json({ message: "User not found." });
    }

    res
      .status(200)
      .json({ message: `User role updated to ${role}.`, user: data });
  } catch (error) {
    next(error);
  }
};

export const manageUserStatus = async (req, res, next) => {
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
      .select("id, name, email, status")
      .single();

    if (error) return next(error);
    if (!data) {
      return res.status(404).json({ message: "User not found." });
    }

    if (status === "suspended") {
      await sendSuspensionEmail(data.email, data.name);
    }

    res
      .status(200)
      .json({ message: `User status updated to ${status}.`, user: data });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
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
      .select("id, name, email, status")
      .single();

    if (error) return next(error);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.status === "active" || user.status === "suspended") {
      await sendDeletionEmail(user.email, user.name);
    } else if (
      user.status === "pending_approval" ||
      user.status === "pending"
    ) {
      await sendRejectionEmail(user.email, user.name);
    }

    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(409).json({
        message:
          "Cannot delete user. They are still the owner of a tournament or backup record. Please reassign ownership or delete those records first.",
      });
    }
    next(error);
  }
};

export const createBackup = async (req, res, next) => {
  const backupData = {};
  const { userId } = req.user;

  try {
    for (const table of TABLES_TO_BACKUP) {
      const { data, error } = await supabase.from(table).select("*");
      if (error) return next(error);
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

    if (uploadError) return next(uploadError);

    const { error: dbError } = await supabase.from("data_backups").insert({
      created_by: userId,
      file_name: fileName,
      storage_path: storagePath,
    });

    if (dbError) return next(dbError);

    res.status(201).json({ message: "Backup created successfully." });
  } catch (error) {
    next(error);
  }
};

export const getBackups = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("data_backups")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return next(error);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const restoreBackup = async (req, res, next) => {
  const { storagePath } = req.body;
  if (!storagePath) {
    return res.status(400).json({ message: "Storage path is required." });
  }

  try {
    const { data: file, error: downloadError } = await supabase.storage
      .from(BUCKET_NAME)
      .download(storagePath);

    if (downloadError) return next(downloadError);

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
          return next(insertError);
        }
      }
    }

    res.status(200).json({ message: "Database restored successfully." });
  } catch (error) {
    next(error);
  }
};
