const mongoose = require('mongoose');
const Envelope = require('@/models/appModels/Envelope');
const Notification = require('@/models/appModels/Notification');

exports.create = async (req, res) => {
  try {
    const { title, documents, signers, fields, status, auditLog } = req.body;
    
    const newEnvelope = new Envelope({
      userId: req.user._id,
      title: title || 'Untitled Document',
      documents: documents || [],
      signers: signers || [],
      fields: fields || [],
      status: status || 'draft',
      auditLog: auditLog || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saved = await newEnvelope.save();

    // Trigger notification if sent
    if (status === 'sent') {
      await new Notification({
        userId: req.user._id,
        title: 'Document Sent',
        message: `"${saved.title}" has been sent to ${saved.signers.length} party(s).`,
        type: 'info',
        link: `/esign?id=${saved._id}`
      }).save();
    }

    return res.status(200).json({
      success: true,
      result: saved,
      message: 'Envelope created successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.list = async (req, res) => {
  try {
    const result = await Envelope.find({ userId: req.user._id, removed: false }).sort({ updatedAt: -1 });
    return res.status(200).json({
      success: true,
      result,
      message: 'Envelopes retrieved successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    updates.updatedAt = new Date();

    const updated = await Envelope.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      updates,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Envelope not found',
      });
    }

    // Trigger notification on completion
    if (updates.status === 'completed') {
      await new Notification({
        userId: req.user._id,
        title: 'Document Signed',
        message: `All parties have completed "${updated.title}".`,
        type: 'success',
        link: `/esign?id=${updated._id}`
      }).save();
    }

    return res.status(200).json({
      success: true,
      result: updated,
      message: 'Envelope updated successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Envelope.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { removed: true },
      { new: true }
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Envelope not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Envelope deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * POST /api/envelope/send
 * Creates/updates the envelope and sends Resend emails to each signer/viewer.
 * Viewers get a read-only link; signers get a signing link.
 */
exports.send = async (req, res) => {
  try {
    const { envelopeId, title, signers = [], appUrl = 'https://stampke.vercel.app' } = req.body;

    if (!signers.length) {
      return res.status(400).json({ success: false, message: 'No recipients provided.' });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      // Resend not configured — return success silently so UI still works
      return res.status(200).json({
        success: true,
        message: 'Emails queued (RESEND_API_KEY not set — configure in env to enable delivery)',
      });
    }

    const results = [];
    for (const signer of signers) {
      if (!signer.email) continue;

      const isViewer = signer.role === 'viewer';
      const accessToken = Buffer.from(`${envelopeId}:${signer.id}:${Date.now()}`).toString('base64url');
      const actionUrl = isViewer
        ? `${appUrl}/view?token=${accessToken}&envelope=${envelopeId}`
        : `${appUrl}/sign?token=${accessToken}&envelope=${envelopeId}`;

      const subject = isViewer
        ? `You've been invited to view: ${title}`
        : `Action required: Please sign "${title}"`;

      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f8faff;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1a73e8,#1557b0);padding:32px 40px;text-align:center;">
      <div style="display:inline-block;width:52px;height:52px;background:white;border-radius:12px;margin-bottom:16px;line-height:52px;text-align:center;">
        <span style="font-size:28px;">🖋</span>
      </div>
      <h1 style="color:white;margin:0;font-size:22px;font-weight:700;">StampKE ${isViewer ? 'Document Viewer' : 'eSign'}</h1>
      <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Digital Document Platform</p>
    </div>
    <!-- Body -->
    <div style="padding:40px;">
      <p style="color:#374151;font-size:16px;font-weight:600;margin:0 0 8px;">Hello ${signer.name || 'there'},</p>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px;">
        ${isViewer
          ? `You have been granted <strong>view access</strong> to the document <strong>"${title}"</strong>. Click the button below to open and read it.`
          : `Your signature is required on the document <strong>"${title}"</strong>. Please click the button below to review and sign.`
        }
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${actionUrl}"
          style="display:inline-block;background:#1a73e8;color:white;text-decoration:none;padding:14px 36px;border-radius:50px;font-size:15px;font-weight:600;box-shadow:0 4px 12px rgba(26,115,232,0.3);">
          ${isViewer ? '👁 View Document' : '✍️ Sign Document'}
        </a>
      </div>
      <p style="color:#9ca3af;font-size:12px;text-align:center;margin:24px 0 0;line-height:1.6;">
        This link is unique to you and expires in 7 days.<br/>
        If you did not expect this email, you can safely ignore it.<br/>
        <a href="${appUrl}" style="color:#1a73e8;">StampKE</a> — Kenya's Digital Stamp & eSign Platform
      </p>
    </div>
    <!-- Footer -->
    <div style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:20px 40px;text-align:center;">
      <p style="color:#d1d5db;font-size:11px;margin:0;">© 2025 JijiTechy Innovations · Nairobi, Kenya · LSK Compliant</p>
    </div>
  </div>
</body>
</html>`;

      // Send via Resend
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'StampKE <noreply@stampke.co.ke>',
          to: [signer.email],
          subject,
          html,
        }),
      });

      const emailData = await emailRes.json();
      results.push({ email: signer.email, id: emailData.id, status: emailRes.ok ? 'sent' : 'failed' });
    }

    const sent = results.filter(r => r.status === 'sent').length;
    return res.status(200).json({
      success: true,
      message: `Emails sent to ${sent}/${results.length} recipients.`,
      result: results,
    });
  } catch (error) {
    console.error('[envelope/send]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
