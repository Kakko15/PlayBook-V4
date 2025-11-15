import supabase from "../supabaseClient.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import speakeasy from "speakeasy";
import crypto from "crypto";
import axios from "axios";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../utils/emailService.js";
import { validatePassword } from "../utils/validation.js";
import { sanitize } from "../utils/sanitize.js";

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:5173/auth/callback/google"
);
const JWT_SECRET = process.env.JWT_SECRET;

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const verifyRecaptcha = async (token) => {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    throw new Error("reCAPTCHA secret key is not configured.");
  }
  const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;
  const { data } = await axios.post(verificationUrl);
  return data.success;
};

const generateJwt = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    aud: "authenticated",
    iat: Math.floor(Date.now() / 1000),
  };
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
  });
};

const getSanitizedUser = (user) => {
  if (!user) return null;
  const { password_hash, otp_secret, ...sanitizedUser } = user;
  return sanitizedUser;
};

export const signup = async (req, res) => {
  const { name, email, password, recaptchaToken } = req.body;

  if (!name || !email || !password || !recaptchaToken) {
    return res
      .status(400)
      .json({ message: "Name, email, password, and reCAPTCHA are required." });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({
      message:
        "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.",
    });
  }

  try {
    const isHuman = await verifyRecaptcha(recaptchaToken);
    if (!isHuman) {
      return res
        .status(403)
        .json({ message: "reCAPTCHA verification failed." });
    }

    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(verificationToken);
    const expiresAt = new Date(Date.now() + 24 * 3600000); // 24 hours

    const { data: newUser, error: insertUserError } = await supabase
      .from("users")
      .insert({
        name: sanitize(name),
        email: sanitize(email),
        password_hash: passwordHash,
        status: "pending", // User is pending email verification
        role: "admin",
        email_verification_token: tokenHash,
        email_verification_expires: expiresAt.toISOString(),
      })
      .select("id")
      .single();

    if (insertUserError) throw insertUserError;

    const { error: insertProfileError } = await supabase
      .from("profiles")
      .insert({
        id: newUser.id,
      });

    if (insertProfileError) throw insertProfileError;

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    await sendVerificationEmail(sanitize(email), sanitize(name), verifyUrl);

    res.status(201).json({
      message: "Registration successful. Please check your email to verify.",
    });
  } catch (error) {
    console.error("Signup Error:", error.message);
    res
      .status(500)
      .json({ message: "Server error during signup.", error: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  try {
    const { data: user, error: findError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (findError) throw findError;
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    if (!user.password_hash) {
      return res.status(401).json({
        message:
          "This account uses Google or Discord login. Please use that method.",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    if (user.status !== "active") {
      let message = "Account is not active.";
      if (user.status === "pending")
        message = "Please check your email to verify your account.";
      if (user.status === "pending_approval")
        message = "Account is pending administrator approval.";
      if (user.status === "suspended") message = "Account has been suspended.";
      return res.status(403).json({ message });
    }

    if (user.otp_enabled) {
      return res.status(200).json({
        otpRequired: true,
        email: user.email,
        message: "OTP code required.",
      });
    }

    const token = generateJwt(user);
    res.status(200).json({
      token,
      user: getSanitizedUser(user),
      message: "Login successful.",
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res
      .status(500)
      .json({ message: "Server error during login.", error: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).send("Verification token is required.");
  }

  const tokenHash = hashToken(token);

  try {
    const { data: user, error: findError } = await supabase
      .from("users")
      .select("id, email, email_verification_expires")
      .eq("email_verification_token", tokenHash)
      .eq("status", "pending")
      .maybeSingle();

    if (findError) throw findError;

    if (!user || new Date() > new Date(user.email_verification_expires)) {
      if (user) {
        // Token is expired, delete user so they can sign up again
        await supabase.from("users").delete().eq("id", user.id);
      }
      return res
        .status(400)
        .send("Invalid or expired verification link. Please sign up again.");
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({
        status: "pending_approval", // Now awaiting admin approval
        email_verification_token: null,
        email_verification_expires: null,
      })
      .eq("id", user.id);

    if (updateError) throw updateError;

    await supabase.rpc("log_activity", {
      p_icon: "how_to_reg",
      p_color: "text-green-600",
      p_title: "New User Verified",
      p_description: `User ${user.email} verified their email and is now pending approval.`,
      p_user_id: user.id,
    });

    // Redirect to a frontend page
    res.redirect(`${process.env.FRONTEND_URL}/pending-approval`);
  } catch (error) {
    console.error("Email Verification Error:", error.message);
    res.status(500).send("Error verifying email.");
  }
};

export const googleOAuth = async (req, res) => {
  const { credential, code } = req.body;

  if (!credential && !code) {
    return res
      .status(400)
      .json({ message: "Google credential or code is required." });
  }

  try {
    let name, email, googleId;

    if (code) {
      const { tokens } = await googleClient.getToken(code);
      googleClient.setCredentials(tokens);

      const ticket = await googleClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      name = payload.name;
      email = payload.email;
      googleId = payload.sub;
    } else {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      name = payload.name;
      email = payload.email;
      googleId = payload.sub;
    }

    const { data: user, error: findError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (findError) throw findError;

    if (!user) {
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({
          name,
          email,
          google_id: googleId,
          status: "pending_approval", // Auto-verified email
          role: "admin",
        })
        .select("id")
        .single();

      if (createError) throw createError;

      await supabase.from("profiles").insert({ id: newUser.id });

      await supabase.rpc("log_activity", {
        p_icon: "how_to_reg",
        p_color: "text-green-600",
        p_title: "New User Registered (Google)",
        p_description: `${email} is pending approval.`,
        p_user_id: newUser.id,
      });

      return res.status(201).json({
        message:
          "Registration request successful. Awaiting administrator approval.",
        requiresApproval: true,
      });
    }

    if (user.status !== "active") {
      let message = "Account is not active.";
      if (user.status === "pending")
        message = "Please check your email to verify your account.";
      if (user.status === "pending_approval")
        message = "Account is pending administrator approval.";
      if (user.status === "suspended") message = "Account has been suspended.";
      return res.status(403).json({
        message,
        requiresApproval: user.status === "pending_approval",
      });
    }

    if (!user.google_id) {
      await supabase
        .from("users")
        .update({ google_id: googleId })
        .eq("id", user.id);
    }

    if (user.otp_enabled) {
      return res.status(200).json({
        otpRequired: true,
        email: user.email,
        message: "OTP code required.",
      });
    }

    const token = generateJwt(user);
    res.status(200).json({
      token,
      user: getSanitizedUser(user),
      message: "Login successful.",
    });
  } catch (error) {
    console.error("Google OAuth Error:", error.message);
    res.status(500).json({
      message: "Google authentication failed.",
      error: error.message,
    });
  }
};

export const discordOAuth = async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ message: "Discord code is required." });
  }

  try {
    const tokenResponse = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${process.env.FRONTEND_URL}/auth/callback/discord`,
        scope: "identify email",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token } = tokenResponse.data;

    const userResponse = await axios.get("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const { username, email, id: discordId } = userResponse.data;

    if (!email) {
      return res.status(400).json({
        message:
          "Could not retrieve email from Discord. Please ensure your Discord account has a verified email.",
      });
    }

    const { data: user, error: findError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (findError) throw findError;

    if (!user) {
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({
          name: username,
          email,
          discord_id: discordId,
          status: "pending_approval", // Auto-verified email
          role: "admin",
        })
        .select("id")
        .single();

      if (createError) throw createError;

      await supabase.from("profiles").insert({ id: newUser.id });

      await supabase.rpc("log_activity", {
        p_icon: "how_to_reg",
        p_color: "text-blue-600",
        p_title: "New User Registered (Discord)",
        p_description: `${email} is pending approval.`,
        p_user_id: newUser.id,
      });

      return res.status(201).json({
        message:
          "Registration request successful. Awaiting administrator approval.",
        requiresApproval: true,
      });
    }

    if (user.status !== "active") {
      let message = "Account is not active.";
      if (user.status === "pending")
        message = "Please check your email to verify your account.";
      if (user.status === "pending_approval")
        message = "Account is pending administrator approval.";
      if (user.status === "suspended") message = "Account has been suspended.";
      return res.status(403).json({
        message,
        requiresApproval: user.status === "pending_approval",
      });
    }

    if (!user.discord_id) {
      await supabase
        .from("users")
        .update({ discord_id: discordId })
        .eq("id", user.id);
    }

    if (user.otp_enabled) {
      return res.status(200).json({
        otpRequired: true,
        email: user.email,
        message: "OTP code required.",
      });
    }

    const token = generateJwt(user);
    res.status(200).json({
      token,
      user: getSanitizedUser(user),
      message: "Login successful.",
    });
  } catch (error) {
    console.error(
      "Discord OAuth Error:",
      error.response?.data || error.message
    );
    res.status(500).json({
      message: "Discord authentication failed.",
      error: error.response?.data || error.message,
    });
  }
};

export const generateOtpSecret = async (req, res) => {
  const { userId, email } = req.user;
  try {
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("otp_secret, otp_enabled")
      .eq("id", userId)
      .single();

    if (fetchError) throw fetchError;

    let secretBase32;

    if (existingUser.otp_secret && !existingUser.otp_enabled) {
      secretBase32 = existingUser.otp_secret;
    } else {
      const secret = speakeasy.generateSecret({
        length: 20,
        name: `PlayBook (${email})`,
        issuer: "PlayBook",
      });
      secretBase32 = secret.base32;

      const { error } = await supabase
        .from("users")
        .update({ otp_secret: secretBase32, otp_enabled: false })
        .eq("id", userId);

      if (error) throw error;
    }

    const otpauthUrl = `otpauth://totp/PlayBook:${encodeURIComponent(email)}?secret=${secretBase32}&issuer=PlayBook`;

    res.status(200).json({
      secret: secretBase32,
      qrCodeUrl: otpauthUrl,
    });
  } catch (error) {
    console.error("Generate OTP Error:", error.message);
    res.status(500).json({ message: "Error generating OTP secret." });
  }
};

export const verifyAndEnableOtp = async (req, res) => {
  const { userId } = req.user;
  const { token } = req.body;

  try {
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("otp_secret")
      .eq("id", userId)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({ message: "User not found." });
    }

    const verified = speakeasy.totp.verify({
      secret: user.otp_secret,
      encoding: "base32",
      token: token,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({ message: "Invalid OTP code." });
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({ otp_enabled: true })
      .eq("id", userId);

    if (updateError) throw updateError;

    res.status(200).json({ message: "2FA enabled successfully." });
  } catch (error) {
    console.error("Verify OTP Error:", error.message);
    res.status(500).json({ message: "Error verifying OTP code." });
  }
};

export const verifyOtpLogin = async (req, res) => {
  const { email, token } = req.body;

  if (!email || !token) {
    return res
      .status(400)
      .json({ message: "Email and OTP token are required." });
  }

  try {
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (fetchError || !user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    if (user.status !== "active") {
      return res.status(403).json({ message: "Account is not active." });
    }

    if (!user.otp_enabled || !user.otp_secret) {
      return res
        .status(400)
        .json({ message: "2FA is not enabled for this account." });
    }

    const verified = speakeasy.totp.verify({
      secret: user.otp_secret,
      encoding: "base32",
      token: token,
      window: 1,
    });

    if (!verified) {
      return res.status(401).json({ message: "Invalid OTP code." });
    }

    const jwtToken = generateJwt(user);
    res.status(200).json({
      token: jwtToken,
      user: getSanitizedUser(user),
      message: "Login successful.",
    });
  } catch (error) {
    console.error("OTP Login Error:", error.message);
    res.status(500).json({ message: "Server error during OTP login." });
  }
};

export const requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    const { data: user, error: findError } = await supabase
      .from("users")
      .select("id, name, status")
      .eq("email", email)
      .maybeSingle();

    if (!findError && user && user.status === "active") {
      const resetToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = hashToken(resetToken);
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour

      await supabase.from("password_reset_tokens").insert({
        email: email,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
      });

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      await sendPasswordResetEmail(email, user.name, resetUrl);
    }

    res.status(200).json({
      message:
        "If an active account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Request Password Reset Error:", error.message);
    res.status(200).json({
      message:
        "If an active account with that email exists, a password reset link has been sent.",
    });
  }
};

export const validateResetToken = async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ message: "Token is required." });
  }

  const tokenHash = hashToken(token);

  try {
    const { data, error } = await supabase
      .from("password_reset_tokens")
      .select("expires_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (error) throw error;

    if (!data || new Date() > new Date(data.expires_at)) {
      if (data) {
        await supabase
          .from("password_reset_tokens")
          .delete()
          .eq("token_hash", tokenHash);
      }
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    res.status(200).json({ message: "Token is valid." });
  } catch (error) {
    console.error("Validate Token Error:", error.message);
    res.status(500).json({ message: "Error validating token." });
  }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ message: "Token and new password are required." });
  }

  if (!validatePassword(newPassword)) {
    return res.status(400).json({
      message:
        "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.",
    });
  }

  const tokenHash = hashToken(token);

  try {
    const { data: tokenRecord, error: findError } = await supabase
      .from("password_reset_tokens")
      .select("email, expires_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (findError) throw findError;

    if (!tokenRecord || new Date() > new Date(tokenRecord.expires_at)) {
      if (tokenRecord) {
        await supabase
          .from("password_reset_tokens")
          .delete()
          .eq("token_hash", tokenHash);
      }
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await supabase
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("email", tokenRecord.email);

    if (updateError) throw updateError;

    await supabase
      .from("password_reset_tokens")
      .delete()
      .eq("token_hash", tokenHash);

    res.status(200).json({ message: "Password has been reset successfully." });
  } catch (error) {
    console.error("Reset Password Error:", error.message);
    res.status(500).json({ message: "Error resetting password." });
  }
};

export const getAccountDetails = async (req, res) => {
  const { userId } = req.user;

  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, email, role, status, created_at, otp_enabled")
      .eq("id", userId)
      .single();

    if (error) throw error;
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Get Account Details Error:", error.message);
    res.status(500).json({ message: "Error fetching account details." });
  }
};

export const updateAccountDetails = async (req, res) => {
  const { userId } = req.user;
  const { name, email } = req.body;

  if (!name && !email) {
    return res.status(400).json({ message: "Name or email is required." });
  }

  try {
    const updates = {};
    if (name) updates.name = sanitize(name);
    if (email) updates.email = sanitize(email);

    if (email) {
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .not("id", "eq", userId)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existingUser) {
        return res
          .status(409)
          .json({ message: "This email is already in use." });
      }
    }

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select("*")
      .single();

    if (error) throw error;

    res.status(200).json({
      user: getSanitizedUser(data),
      message: "Account updated successfully.",
    });
  } catch (error) {
    console.error("Update Account Error:", error.message);
    res.status(500).json({ message: "Error updating account details." });
  }
};

export const updatePassword = async (req, res) => {
  const { userId } = req.user;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Current and new passwords are required." });
  }

  if (!validatePassword(newPassword)) {
    return res.status(400).json({
      message:
        "New password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.",
    });
  }

  try {
    const { data: user, error: findError } = await supabase
      .from("users")
      .select("password_hash")
      .eq("id", userId)
      .single();

    if (findError) throw findError;

    if (!user.password_hash) {
      return res
        .status(400)
        .json({ message: "Cannot update password for OAuth-only accounts." });
    }

    const passwordMatch = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid current password." });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await supabase
      .from("users")
      .update({ password_hash: newPasswordHash })
      .eq("id", userId);

    if (updateError) throw updateError;

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Update Password Error:", error.message);
    res.status(500).json({ message: "Error updating password." });
  }
};

export const getProfile = async (req, res) => {
  const { userId } = req.user;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error("Get Profile Error:", error.message);
    res.status(500).json({ message: "Error fetching profile." });
  }
};

export const updateProfile = async (req, res) => {
  const { userId } = req.user;
  const { pronouns, about_me, phone } = req.body;

  const updates = {};
  if (pronouns !== undefined) updates.pronouns = sanitize(pronouns);
  if (about_me !== undefined) updates.about_me = sanitize(about_me);
  if (phone !== undefined) updates.phone = sanitize(phone);

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: "No fields to update." });
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json({ data, message: "Profile updated successfully." });
  } catch (error) {
    console.error("Update Profile Error:", error.message);
    res.status(500).json({ message: "Error updating profile." });
  }
};

const MAX_BASE64_SIZE = 7000000; // ~5MB (5 * 1024 * 1024 * 1.33)

export const updateProfilePicture = async (req, res) => {
  const { userId } = req.user;
  const { imageBase64 } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ message: "Image data is required." });
  }

  if (imageBase64.length > MAX_BASE64_SIZE) {
    return res.status(413).json({ message: "Image file is too large." });
  }

  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .update({ profile_picture_url: imageBase64 })
      .eq("id", userId)
      .select("profile_picture_url")
      .single();

    if (error) throw error;

    res.status(200).json({
      message: "Profile picture updated.",
      profilePictureUrl: profile.profile_picture_url,
    });
  } catch (error) {
    console.error("Update PFP Error:", error.message);
    res.status(500).json({ message: "Error updating profile picture." });
  }
};

export const removeProfilePicture = async (req, res) => {
  const { userId } = req.user;
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ profile_picture_url: null })
      .eq("id", userId);

    if (error) throw error;
    res.status(200).json({ message: "Profile picture removed." });
  } catch (error) {
    console.error("Remove PFP Error:", error.message);
    res.status(500).json({ message: "Error removing profile picture." });
  }
};

export const detectFace = async (req, res) => {
  const { imageBase64 } = req.body;
  const apiKey = process.env.FACEPLUSPLUS_API_KEY;
  const apiSecret = process.env.FACEPLUSPLUS_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res
      .status(500)
      .json({ message: "Face detection is misconfigured." });
  }

  if (!imageBase64) {
    return res.status(400).json({ message: "Image data is required." });
  }

  if (imageBase64.length > MAX_BASE64_SIZE) {
    return res.status(413).json({ message: "Image file is too large." });
  }

  try {
    const base64Data = imageBase64.replace(
      /^data:image\/(png|jpeg|jpg);base64,/,
      ""
    );

    const params = new URLSearchParams();
    params.append("api_key", apiKey);
    params.append("api_secret", apiSecret);
    params.append("image_base64", base64Data);
    params.append("return_attributes", "gender,age,facequality");
    params.append("return_landmark", "1"); // Get facial landmarks for better validation

    const response = await axios.post(
      "https://api-us.faceplusplus.com/facepp/v3/detect",
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const faces = response.data?.faces;

    if (!faces || !Array.isArray(faces) || faces.length === 0) {
      return res.status(200).json({
        faceFound: false,
        message: "No face detected. Please upload a clear photo of yourself.",
      });
    }

    const face = faces[0];
    const faceQuality = face.attributes?.facequality?.value || 0;
    const confidence = face.confidence || 0;
    const age = face.attributes?.age?.value;

    console.log("Face detection result:", {
      faceQuality,
      confidence,
      age,
      threshold: face.attributes?.facequality?.threshold,
    });

    // Validate based on face quality only (confidence is often 0 from Face++ API)
    // Quality threshold of 30 helps filter out animal faces
    if (faceQuality < 30) {
      return res.status(200).json({
        faceFound: false,
        message: "Please upload a clear, well-lit photo of your face.",
      });
    }

    // Additional check: age should be reasonable for a human (5-100)
    if (age && (age < 5 || age > 100)) {
      return res.status(200).json({
        faceFound: false,
        message: "Please upload a photo of a human face.",
      });
    }

    // Accept the face
    const isGoodQuality = faceQuality >= 70 && confidence >= 85;

    res.status(200).json({
      faceFound: true,
      message: isGoodQuality
        ? "Face detected successfully."
        : "Face detected. Quality could be better, but acceptable.",
      quality: faceQuality,
      confidence: confidence,
    });
  } catch (error) {
    console.error(
      "Face++ API Error:",
      error.response?.data?.error_message || error.message
    );
    res.status(500).json({
      message: error.response?.data?.error_message || "Face detection failed.",
    });
  }
};
