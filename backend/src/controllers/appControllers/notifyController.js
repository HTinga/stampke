'use strict';
// notifyController.js — Resend-powered email notifications for sign requests
const sendEmail = require('@/utils/sendEmail');

const FROM    = 'StampKE Sign <noreply@tomo.ke>';
const SUPPORT = 'hempstonetinga@gmail.com';

// POST /api/notify/sign-request
// Body: { toEmail, toName, documentTitle, signerRole, signLink }
exports.signRequest = async (req, res) => {
  const { toEmail, toName, documentTitle, signerRole, signLink } = req.body;
  if (!toEmail || !documentTitle)
    return res.status(400).json({ success: false, message: 'toEmail and documentTitle are required' });

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

        <!-- Header -->
        <tr><td align="center" style="padding:0 0 28px">
          <div style="display:inline-block;background:#18181b;border-radius:12px;padding:12px 24px">
            <span style="color:#fff;font-size:22px;font-weight:900;letter-spacing:-0.5px">StampKE</span>
            <span style="color:#71717a;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;display:block;margin-top:2px">Document Signing Request</span>
          </div>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#fff;border-radius:20px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
          <p style="font-size:16px;color:#18181b;margin:0 0 16px">Hi <strong>${toName || toEmail}</strong>,</p>
          <p style="font-size:15px;color:#52525b;line-height:1.7;margin:0 0 24px">
            You've been requested to review and sign the following document as <strong style="color:#18181b">${signerRole || 'Signer'}</strong>:
          </p>

          <!-- Document name -->
          <div style="background:#f0f7ff;border-left:4px solid #1f6feb;border-radius:8px;padding:18px 22px;margin:0 0 32px">
            <p style="color:#1e3a8a;font-weight:800;font-size:16px;margin:0">${documentTitle}</p>
          </div>

          <!-- CTA -->
          <div style="text-align:center;margin:0 0 32px">
            <a href="${signLink}" style="display:inline-block;background:#18181b;color:#fff;font-weight:800;font-size:15px;text-decoration:none;padding:15px 40px;border-radius:10px;letter-spacing:0.2px">
              ${signerRole === 'viewer' ? 'Review Document' : 'Review & Sign Document'} &rarr;
            </a>
          </div>

          <p style="font-size:13px;color:#71717a;line-height:1.6;margin:0 0 8px">This signing link is unique to you — please do not share it.</p>
          <p style="font-size:13px;color:#71717a;line-height:1.6;margin:0">If you didn't expect this request, you can safely ignore this email.</p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 0 0;text-align:center">
          <p style="font-size:12px;color:#a1a1aa;margin:0">&copy; ${new Date().getFullYear()} StampKE &middot; Nairobi, Kenya &middot; KICA-Compliant eSign Platform</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await sendEmail({
      from:    FROM,
      to:      toEmail,
      subject: signerRole === 'viewer' ? `Review Requested: "${documentTitle}"` : `Action Required: Please sign "${documentTitle}"`,
      html,
    });
    return res.json({ success: true, result: { sent: true, to: toEmail } });
  } catch (err) {
    return res.json({ success: true, result: { sent: false, error: err.message } });
  }
};

// POST /api/notify/completed
// Notifies document owner that all signatures are complete
exports.completed = async (req, res) => {
  const { toEmail, toName, documentTitle, downloadLink } = req.body;
  if (!toEmail || !documentTitle)
    return res.status(400).json({ success: false, message: 'toEmail and documentTitle required' });

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
        <tr><td align="center" style="padding:0 0 28px">
          <div style="display:inline-block;background:#18181b;border-radius:12px;padding:12px 24px">
            <span style="color:#fff;font-size:22px;font-weight:900">StampKE</span>
          </div>
        </td></tr>
        <tr><td style="background:#fff;border-radius:20px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
          <div style="text-align:center;margin-bottom:24px">
            <div style="width:56px;height:56px;background:#dcfce7;border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:28px">✅</div>
            <h2 style="color:#18181b;font-size:22px;font-weight:900;margin:0">Document Fully Signed</h2>
          </div>
          <p style="font-size:15px;color:#52525b;line-height:1.7;margin:0 0 24px">
            Hi <strong style="color:#18181b">${toName || toEmail}</strong>, all parties have signed <strong style="color:#18181b">"${documentTitle}"</strong>. Your completed document is ready.
          </p>
          ${downloadLink ? `
          <div style="text-align:center;margin:0 0 24px">
            <a href="${downloadLink}" style="display:inline-block;background:#059669;color:#fff;font-weight:800;font-size:15px;text-decoration:none;padding:14px 36px;border-radius:10px">
              Download Signed Document &rarr;
            </a>
          </div>` : ''}
          <p style="font-size:13px;color:#71717a;margin:0">Questions? Reply to this email or contact us at <a href="mailto:${SUPPORT}" style="color:#1f6feb">${SUPPORT}</a></p>
        </td></tr>
        <tr><td style="padding:24px 0 0;text-align:center">
          <p style="font-size:12px;color:#a1a1aa;margin:0">&copy; ${new Date().getFullYear()} StampKE &middot; Nairobi, Kenya</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  try {
    await sendEmail({
      from: FROM, to: toEmail,
      subject: `✅ Signed: "${documentTitle}" — All parties have signed`,
      html,
    });
    return res.json({ success: true, result: { sent: true } });
  } catch (err) {
    return res.json({ success: true, result: { sent: false, error: err.message } });
  }
};
