import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendEmail = async (to, subject, html) => {
  const mailOptions = {
    from: `"PlayBook" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${info.messageId}`);
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
  }
};

const emailTemplate = (title, preheader, content) => {
  return `
    <html lang="en">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { margin: 0; padding: 0; font-family: 'Inter', 'Google Sans', Arial, sans-serif; background-color: #f8f9f8; }
        .container { width: 90%; max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e0e0e0; }
        .header { background-color: #005a3a; padding: 40px; text-align: center; }
        .header img { width: 60px; height: 60px; margin-bottom: 16px; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; }
        .content { padding: 40px; }
        .content h2 { font-size: 22px; font-weight: 600; color: #1f1f1f; margin-top: 0; margin-bottom: 24px; }
        .content p { font-size: 16px; color: #5f6368; line-height: 1.6; margin-bottom: 24px; }
        .button-container { text-align: center; }
        .button { display: inline-block; padding: 14px 28px; background-color: #005a3a; color: #ffffff; text-decoration: none; border-radius: 28px; font-weight: 600; font-size: 16px; }
        .footer { padding: 40px; text-align: center; background-color: #f8f9f8; }
        .footer p { font-size: 12px; color: #717972; margin: 0 0 8px 0; }
      </style>
    </head>
    <body>
      <span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</span>
      <div class="container">
        <div class="header">
          <img src="https://i.ibb.co/b3s1JSt/playbook-logo-email.png" alt="PlayBook Logo">
          <h1>PlayBook</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} PlayBook & Isabela State University.</p>
          <p>This is an automated message. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const sendApprovalEmail = async (userEmail, userName) => {
  const title = "Your PlayBook Account is Approved!";
  const preheader = "You can now log in and start managing tournaments.";
  const content = `
    <h2>Welcome to PlayBook, ${userName}!</h2>
    <p>Good news! Your administrator account for PlayBook has been reviewed and approved by a Super Admin.</p>
    <p>You can now log in to manage tournaments, teams, and stats for Isabela State University.</p>
    <div class="button-container">
      <a href="${process.env.FRONTEND_URL}/login" class="button">Log In Now</a>
    </div>
  `;
  const html = emailTemplate(title, preheader, content);
  await sendEmail(userEmail, title, html);
};

export const sendPasswordResetEmail = async (userEmail, userName, resetUrl) => {
  const title = "Reset Your PlayBook Password";
  const preheader = "A request was made to reset your password.";
  const content = `
    <h2>Hi ${userName},</h2>
    <p>We received a request to reset the password for your PlayBook account. If you did not make this request, you can safely ignore this email.</p>
    <p>To create a new password, click the button below. This link will expire in 1 hour.</p>
    <div class="button-container">
      <a href="${resetUrl}" class="button">Reset Your Password</a>
    </div>
    <p style="font-size: 12px; text-align: center; margin-top: 24px; word-break: break-all;">If you're having trouble, copy and paste this URL into your browser:<br>${resetUrl}</p>
  `;
  const html = emailTemplate(title, preheader, content);
  await sendEmail(userEmail, title, html);
};

export const sendVerificationEmail = async (userEmail, userName, verifyUrl) => {
  const title = "Verify Your PlayBook Account";
  const preheader = "One last step to get started with PlayBook.";
  const content = `
    <h2>Welcome to PlayBook, ${userName}!</h2>
    <p>We're excited to have you on board. Please verify your email address by clicking the button below. This link will expire in 24 hours.</p>
    <div class="button-container">
      <a href="${verifyUrl}" class="button">Verify Your Email</a>
    </div>
    <p style="font-size: 12px; text-align: center; margin-top: 24px; word-break: break-all;">If you're having trouble, copy and paste this URL into your browser:<br>${verifyUrl}</p>
  `;
  const html = emailTemplate(title, preheader, content);
  await sendEmail(userEmail, title, html);
};
