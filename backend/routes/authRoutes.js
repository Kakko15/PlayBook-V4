import express from "express";
import {
  signup,
  login,
  verifyEmail,
  googleOAuth,
  discordOAuth,
  generateOtpSecret,
  verifyAndEnableOtp,
  verifyOtpLogin,
  requestPasswordReset,
  validateResetToken,
  resetPassword,
  getAccountDetails,
  updateAccountDetails,
  updatePassword,
  getProfile,
  updateProfile,
  updateProfilePicture,
  removeProfilePicture,
} from "../controllers/authController.js";
import {
  loginLimiter,
  signupLimiter,
  otpLimiter,
  passwordResetLimiter,
  defaultLimiter,
  uploadLimiter,
} from "../middleware/securityMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", signupLimiter, signup);
router.post("/login", loginLimiter, login);

router.get("/verify-email", defaultLimiter, verifyEmail);

router.post("/oauth/google", defaultLimiter, googleOAuth);
router.post("/oauth/discord", defaultLimiter, discordOAuth);

router.post("/otp/generate", protect, defaultLimiter, generateOtpSecret);
router.post("/otp/verify-setup", protect, otpLimiter, verifyAndEnableOtp);
router.post("/otp/verify-login", otpLimiter, verifyOtpLogin);

router.post(
  "/password/request-reset",
  passwordResetLimiter,
  requestPasswordReset
);
router.post("/password/validate-token", defaultLimiter, validateResetToken);
router.post("/password/reset", passwordResetLimiter, resetPassword);

router.get("/account", protect, getAccountDetails);
router.patch("/account", protect, defaultLimiter, updateAccountDetails);
router.put("/password", protect, passwordResetLimiter, updatePassword);

router.get("/profile", protect, getProfile);
router.patch("/profile", protect, defaultLimiter, updateProfile);

router.post("/profile/picture", protect, uploadLimiter, updateProfilePicture);
router.delete(
  "/profile/picture",
  protect,
  defaultLimiter,
  removeProfilePicture
);
// The /profile/detect-face route has been removed.

export default router;
