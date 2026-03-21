const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'hempstonetinga@gmail.com';
const APP_NAME = 'Tomo';

// Notify admin that a new user signed up and needs activation
const notifyAdminNewSignup = async ({ name, email, role }) => {
  try {
    await resend.emails.send({
      from: `${APP_NAME} <noreply@tomo.ke>`,
      to: ADMIN_EMAIL,
      subject: `[Tomo] New ${role} signup — ${name}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#1f6feb">New user signup on Tomo</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Role:</strong> <span style="text-transform:capitalize">${role}</span></p>
          <p style="margin-top:24px">
            <a href="${process.env.FRONTEND_URL}/admin" 
               style="background:#1f6feb;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold">
              Review & Activate
            </a>
          </p>
          <p style="color:#888;font-size:12px;margin-top:24px">
            You are receiving this because you are the Tomo platform admin.
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error('[Email] Failed to notify admin:', err.message);
  }
};

// Notify user their account has been activated
const notifyUserActivated = async ({ name, email, role }) => {
  try {
    await resend.emails.send({
      from: `${APP_NAME} <noreply@tomo.ke>`,
      to: email,
      subject: `[Tomo] Your account is now active!`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#1f6feb">Welcome to Tomo, ${name}!</h2>
          <p>Your <strong>${role}</strong> account has been activated by the admin.</p>
          <p>You can now sign in and use all features.</p>
          <p style="margin-top:24px">
            <a href="${process.env.FRONTEND_URL}"
               style="background:#1f6feb;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold">
              Sign In to Tomo
            </a>
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error('[Email] Failed to notify user:', err.message);
  }
};

// Notify user their account was suspended
const notifyUserSuspended = async ({ name, email, reason }) => {
  try {
    await resend.emails.send({
      from: `${APP_NAME} <noreply@tomo.ke>`,
      to: email,
      subject: `[Tomo] Account update`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#ef4444">Account Suspended</h2>
          <p>Hi ${name},</p>
          <p>Your Tomo account has been suspended.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          <p>Contact <a href="mailto:${ADMIN_EMAIL}">${ADMIN_EMAIL}</a> if you believe this is an error.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('[Email] Failed to notify suspension:', err.message);
  }
};

// Invoice reminder email
const sendInvoiceReminder = async ({ invoice, clientEmail, clientName }) => {
  try {
    await resend.emails.send({
      from: `${invoice.businessName || APP_NAME} <noreply@tomo.ke>`,
      to: clientEmail,
      subject: `Payment Reminder: ${invoice.invoiceNumber} — ${invoice.currency} ${invoice.total.toLocaleString()}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#1f6feb">Payment Reminder</h2>
          <p>Hi ${clientName},</p>
          <p>This is a reminder that invoice <strong>${invoice.invoiceNumber}</strong> for 
          <strong>${invoice.currency} ${invoice.total.toLocaleString()}</strong> is due on 
          <strong>${new Date(invoice.dueDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.</p>
          ${invoice.note ? `<p>${invoice.note}</p>` : ''}
          <p style="color:#888;font-size:12px">Sent via Tomo Invoice Tracker</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('[Email] Failed to send reminder:', err.message);
  }
};

module.exports = { notifyAdminNewSignup, notifyUserActivated, notifyUserSuspended, sendInvoiceReminder };
