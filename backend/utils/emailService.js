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
  const primaryColor = "#16a34a";
  const lightGray = "#f3f4f6";
  const darkGray = "#374151";
  const textDark = "#111827";
  const logoUrl = `${process.env.FRONTEND_URL}/playbook_logo.png`;
  const year = new Date().getFullYear();

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: ${lightGray};
          font-family: 'Inter', 'Google Sans', Arial, sans-serif;
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: ${lightGray};">
      <span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</span>
      
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding: 40px 16px 40px 16px;">
            
            <table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e5e7eb;">
              
              <tr>
                <td align="center" style="padding: 32px 40px 24px 40px;">
                  <img src="${logoUrl}" alt="PlayBook Tournament System" style="display: block; margin-bottom: 24px; width: 80px; height: 80px; border: 0;">
                </td>
              </tr>
              
              <tr>
                <td style="padding: 0 40px 40px 40px; color: ${textDark}; font-family: 'Inter', 'Google Sans', Arial, sans-serif; text-align: center;">
                  ${content}
                </td>
              </tr>
              
            </table>
            
            <table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; margin-top: 24px;">
              <tr>
                <td align="center" style="padding: 0 40px 0 40px;">
                  <p style="font-size: 12px; color: #717972; margin: 0 0 8px 0; font-family: 'Inter', 'Google Sans', Arial, sans-serif;">
                    &copy; ${year} PlayBook & Isabela State University.
                  </p>
                  <p style="font-size: 12px; color: #717972; margin: 0; font-family: 'Inter', 'Google Sans', Arial, sans-serif;">
                    This is an automated message. Please do not reply.
                  </p>
                </td>
              </tr>
            </table>

          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export const sendApprovalEmail = async (userEmail, userName) => {
  const title = "Your PlayBook Account is Approved!";
  const preheader = "You can now log in and start managing tournaments.";
  const content = `
    <h2 style="font-family: 'Google Sans', 'Inter', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #111827; margin-top: 0; margin-bottom: 24px;">
      Welcome to PlayBook, ${userName}!
    </h2>
    <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 16px;">
      Good news! Your administrator account for PlayBook has been reviewed and approved by a Super Admin.
    </p>
    <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 24px;">
      You can now log in to manage tournaments, teams, and stats for Isabela State University.
    </p>
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding: 16px 0;">
          <a href="${process.env.FRONTEND_URL}/login"
             style="display: inline-block; padding: 14px 28px; background-color: #16a34a; color: #ffffff !important; text-decoration: none; border-radius: 28px; font-weight: 600; font-size: 16px; font-family: 'Google Sans', 'Inter', Arial, sans-serif; border: 0;"
             target="_blank">
            Log In Now
          </a>
        </td>
      </tr>
    </table>
  `;
  const html = emailTemplate(title, preheader, content);
  await sendEmail(userEmail, title, html);
};

export const sendRejectionEmail = async (userEmail, userName) => {
  const title = "Your PlayBook Registration";
  const preheader = "An update on your PlayBook account status.";
  const content = `
    <h2 style="font-family: 'Google Sans', 'Inter', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #111827; margin-top: 0; margin-bottom: 24px;">
      Hi ${userName},
    </h2>
    <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 16px;">
      Thank you for your interest in PlayBook. After a review, your registration for an administrator account has not been approved at this time.
    </p>
    <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 24px;">
      If you believe this is an error, please contact your Super Admin for further assistance.
    </p>
  `;
  const html = emailTemplate(title, preheader, content);
  await sendEmail(userEmail, title, html);
};

export const sendSuspensionEmail = async (userEmail, userName) => {
  const title = "Your PlayBook Account Has Been Suspended";
  const preheader = "Your account access has been temporarily revoked.";
  const content = `
    <h2 style="font-family: 'Google Sans', 'Inter', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #111827; margin-top: 0; margin-bottom: 24px;">
      Hi ${userName},
    </h2>
    <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 16px;">
      Your PlayBook administrator account has been suspended by a Super Admin. You will not be able to log in.
    </p>
    <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 24px;">
      If you believe this is an error, please contact your Super Admin for further assistance.
    </p>
  `;
  const html = emailTemplate(title, preheader, content);
  await sendEmail(userEmail, title, html);
};

export const sendDeletionEmail = async (userEmail, userName) => {
  const title = "Your PlayBook Account Has Been Deleted";
  const preheader = "Your account and associated data have been removed.";
  const content = `
    <h2 style="font-family: 'Google Sans', 'Inter', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #111827; margin-top: 0; margin-bottom: 24px;">
      Hi ${userName},
    </h2>
    <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 16px;">
      Your PlayBook administrator account has been permanently deleted by a Super Admin.
    </p>
    <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 24px;">
      All of your associated data has been removed from our system. If you wish to use PlayBook in the future, you will need to sign up again.
    </p>
  `;
  const html = emailTemplate(title, preheader, content);
  await sendEmail(userEmail, title, html);
};

export const sendPasswordResetEmail = async (userEmail, userName, resetUrl) => {
  const title = "Reset Your PlayBook Password";
  const preheader = "A request was made to reset your password.";
  const content = `
    <h2 style="font-family: 'Google Sans', 'Inter', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #111827; margin-top: 0; margin-bottom: 24px;">
      Hi ${userName},
    </h2>
    <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 16px;">
      We received a request to reset the password for your PlayBook account. If you did not make this request, you can safely ignore this email.
    </p>
    <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 24px;">
      To create a new password, click the button below. This link will expire in 1 hour.
    </p>
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding: 16px 0;">
          <a href="${resetUrl}"
             style="display: inline-block; padding: 14px 28px; background-color: #16a34a; color: #ffffff !important; text-decoration: none; border-radius: 28px; font-weight: 600; font-size: 16px; font-family: 'Google Sans', 'Inter', Arial, sans-serif; border: 0;"
             target="_blank">
            Reset Your Password
          </a>
        </td>
      </tr>
    </table>
    <p style="font-size: 12px; text-align: center; margin-top: 24px; word-break: break-all; color: #374151; line-height: 1.6;">
      If you're having trouble, copy and paste this URL into your browser:<br>
      <a href="${resetUrl}" style="color: #16a34a; text-decoration: underline;">${resetUrl}</a>
    </p>
  `;
  const html = emailTemplate(title, preheader, content);
  await sendEmail(userEmail, title, html);
};

export const sendVerificationEmail = async (userEmail, userName, verifyUrl) => {
  const title = "Verify Your PlayBook Account";
  const preheader = "One last step to get started with PlayBook.";
  const content = `
    <h2 style="font-family: 'Google Sans', 'Inter', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #111827; margin-top: 0; margin-bottom: 24px;">
      Welcome to PlayBook, ${userName}!
    </h2>
    <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 24px;">
      We're excited to have you on board. Please verify your email address by clicking the button below. This link will expire in 24 hours.
    </p>
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding: 16px 0;">
          <a href="${verifyUrl}"
             style="display: inline-block; padding: 14px 28px; background-color: #16a34a; color: #ffffff !important; text-decoration: none; border-radius: 28px; font-weight: 600; font-size: 16px; font-family: 'Google Sans', 'Inter', Arial, sans-serif; border: 0;"
             target="_blank">
            Verify Your Email
          </a>
        </td>
      </tr>
    </table>
    <p style="font-size: 12px; text-align: center; margin-top: 24px; word-break: break-all; color: #374151; line-height: 1.6;">
      If you're having trouble, copy and paste this URL into your browser:<br>
      <a href="${verifyUrl}" style="color: #16a34a; text-decoration: underline;">${verifyUrl}</a>
    </p>
  `;
  const html = emailTemplate(title, preheader, content);
  await sendEmail(userEmail, title, html);
};
