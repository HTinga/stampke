'use strict';
// notifyController.js — Gmail-powered email notifications for sign requests
// Uses nodemailer with OAuth2 or App Password (simpler for self-hosted)
// Set GMAIL_USER and GMAIL_APP_PASSWORD in Vercel env vars

const nodemailer = require('nodemailer');

function getTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

// POST /api/notify/sign-request
// Body: { toEmail, toName, documentTitle, signerRole, signLink }
exports.signRequest = async (req, res) => {
  const { toEmail, toName, documentTitle, signerRole, signLink } = req.body;
  if (!toEmail || !documentTitle) {
    return res.status(400).json({ success: false, message: 'toEmail and documentTitle are required' });
  }

  const transport = getTransport();
  if (!transport) {
    // Silently succeed if email not configured — don't block the workflow
    return res.json({ success: true, result: { sent: false, reason: 'Email not configured' } });
  }

  const senderName = process.env.GMAIL_SENDER_NAME || 'StampKE Sign';
  const senderEmail = process.env.GMAIL_USER;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#1e3a8a,#1f6feb);padding:32px 40px;text-align:center;">
          <h1 style="color:#ffffff;font-size:24px;font-weight:900;margin:0;letter-spacing:-0.5px;">StampKE</h1>
          <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:8px 0 0;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Document Signing Request</p>
        </div>

        <!-- Body -->
        <div style="padding:40px;">
          <p style="color:#1a1a2e;font-size:16px;margin:0 0 16px;">Hi <strong>${toName || toEmail}</strong>,</p>
          <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 24px;">
            You've been requested to sign the following document as <strong>${signerRole || 'signer'}</strong>:
          </p>

          <div style="background:#f0f7ff;border-left:4px solid #1f6feb;border-radius:8px;padding:20px 24px;margin:0 0 32px;">
            <p style="color:#1e3a8a;font-weight:800;font-size:16px;margin:0;">${documentTitle}</p>
          </div>

          <div style="text-align:center;margin:0 0 32px;">
            <a href="${signLink}" style="display:inline-block;background:#1f6feb;color:#ffffff;font-weight:800;font-size:15px;text-decoration:none;padding:16px 40px;border-radius:12px;letter-spacing:0.3px;">
              Review &amp; Sign Document →
            </a>
          </div>

          <p style="color:#888;font-size:13px;line-height:1.6;margin:0 0 8px;">
            This link is unique to you. Please do not share it with others.
          </p>
          <p style="color:#888;font-size:13px;line-height:1.6;margin:0;">
            If you did not expect this request, you can safely ignore this email.
          </p>
        </div>

        <!-- Footer -->
        <div style="background:#f8f9fa;padding:24px 40px;border-top:1px solid #eee;text-align:center;">
          <p style="color:#aaa;font-size:12px;margin:0;">
            Sent via <strong>StampKE</strong> · Secure Document Platform · Nairobi, Kenya
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transport.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: `${toName || ''} <${toEmail}>`.trim(),
      subject: `Action Required: Sign "${documentTitle}"`,
      html,
    });
    return res.json({ success: true, result: { sent: true, to: toEmail } });
  } catch (err) {
    console.error('[notify] email send failed:', err.message);
    return res.json({ success: true, result: { sent: false, error: err.message } });
  }
};

// POST /api/notify/completed
// Notifies document owner that all signatures are complete
exports.completed = async (req, res) => {
  const { toEmail, toName, documentTitle, downloadLink } = req.body;
  if (!toEmail || !documentTitle) {
    return res.status(400).json({ success: false, message: 'toEmail and documentTitle required' });
  }

  const transport = getTransport();
  if (!transport) return res.json({ success: true, result: { sent: false, reason: 'Email not configured' } });

  const senderName = process.env.GMAIL_SENDER_NAME || 'StampKE Sign';
  const senderEmail = process.env.GMAIL_USER;

  const html = `
    <!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,sans-serif;">
    <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <div style="background:linear-gradient(135deg,#065f46,#059669);padding:32px 40px;text-align:center;">
        <h1 style="color:#fff;font-size:24px;font-weight:900;margin:0;">✅ Document Signed</h1>
      </div>
      <div style="padding:40px;">
        <p style="color:#1a1a2e;font-size:16px;">Hi <strong>${toName || toEmail}</strong>,</p>
        <p style="color:#444;font-size:15px;line-height:1.6;">All parties have signed <strong>"${documentTitle}"</strong>. Your completed document is ready.</p>
        ${downloadLink ? `<div style="text-align:center;margin:32px 0;"><a href="${downloadLink}" style="display:inline-block;background:#059669;color:#fff;font-weight:800;font-size:15px;text-decoration:none;padding:16px 40px;border-radius:12px;">Download Signed Document →</a></div>` : ''}
      </div>
      <div style="background:#f8f9fa;padding:24px 40px;border-top:1px solid #eee;text-align:center;">
        <p style="color:#aaa;font-size:12px;margin:0;">StampKE · Secure Document Platform · Nairobi, Kenya</p>
      </div>
    </div>
    </body></html>
  `;

  try {
    await transport.sendMail({ from: `"${senderName}" <${senderEmail}>`, to: `${toName || ''} <${toEmail}>`.trim(), subject: `✅ Signed: "${documentTitle}"`, html });
    return res.json({ success: true, result: { sent: true } });
  } catch (err) {
    return res.json({ success: true, result: { sent: false, error: err.message } });
  }
};
