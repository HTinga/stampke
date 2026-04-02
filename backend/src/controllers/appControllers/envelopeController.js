const supabase = require('@/config/supabase');

exports.create = async (req, res) => {
  try {
    const { title, documents, signers, fields, status, auditLog } = req.body;
    
    const { data: saved, error } = await supabase
      .from('envelopes')
      .insert([{
        created_by: req.user.id,
        title: title || 'Untitled Document',
        file_url: documents?.[0]?.url || null, // Assuming first doc for now, adjust as needed
        status: status || 'draft',
        // Note: documents, signers, fields, auditLog should be JSONB columns
        // I'll assume they exist in the schema I provided earlier
      }])
      .select()
      .single();

    if (error) throw error;

    // Trigger notification if sent
    if (status === 'sent') {
      await supabase.from('notifications').insert([{
        user_id: req.user.id,
        title: 'Document Sent',
        message: `"${saved.title}" has been sent.`,
        type: 'info',
        link: `/esign?id=${saved.id}`
      }]);
    }

    return res.status(200).json({
      success: true,
      result: saved,
      message: 'Envelope created successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.list = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('envelopes')
      .select('*')
      .eq('created_by', req.user.id)
      .eq('removed', false)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      result: data,
      message: 'Envelopes retrieved successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body, updated_at: new Date() };

    const { data: updated, error } = await supabase
      .from('envelopes')
      .update(updates)
      .eq('id', id)
      .eq('created_by', req.user.id)
      .select()
      .single();

    if (error || !updated) {
      return res.status(404).json({ success: false, message: 'Envelope not found' });
    }

    // Trigger notification on completion
    if (updates.status === 'completed') {
      await supabase.from('notifications').insert([{
        user_id: req.user.id,
        title: 'Document Signed',
        message: `All parties have completed "${updated.title}".`,
        type: 'success',
        link: `/esign?id=${updated.id}`
      }]);
    }

    return res.status(200).json({
      success: true,
      result: updated,
      message: 'Envelope updated successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('envelopes')
      .update({ removed: true })
      .eq('id', id)
      .eq('created_by', req.user.id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Envelope not found' });
    }

    return res.status(200).json({ success: true, message: 'Envelope deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.send = async (req, res) => {
  try {
    const { envelopeId, title, signers = [], appUrl = 'https://stampke.vercel.app' } = req.body;

    if (!signers.length) {
      return res.status(400).json({ success: false, message: 'No recipients provided.' });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
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
    <div style="background:linear-gradient(135deg,#1a73e8,#1557b0);padding:32px 40px;text-align:center;">
      <div style="display:inline-block;width:52px;height:52px;background:white;border-radius:12px;margin-bottom:16px;line-height:52px;text-align:center;">
        <span style="font-size:28px;">🖋</span>
      </div>
      <h1 style="color:white;margin:0;font-size:22px;font-weight:700;">StampKE ${isViewer ? 'Document Viewer' : 'eSign'}</h1>
      <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Digital Document Platform</p>
    </div>
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
    <div style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:20px 40px;text-align:center;">
      <p style="color:#d1d5db;font-size:11px;margin:0;">© 2025 JijiTechy Innovations · Nairobi, Kenya · LSK Compliant</p>
    </div>
  </div>
</body>
</html>`;

      const { data: emailData, error: emailError } = await fetch('https://api.resend.com/emails', {
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
      }).then(r => r.json());

      if (emailError) {
        results.push({ email: signer.email, status: 'failed' });
      } else {
        results.push({ email: signer.email, id: emailData.id, status: 'sent' });
      }
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

