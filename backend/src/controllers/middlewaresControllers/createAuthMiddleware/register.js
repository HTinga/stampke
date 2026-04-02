'use strict';
const sendEmail = require('@/utils/sendEmail');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const supabase = require('@/config/supabase');
const shortid = require('shortid');
const crypto = require('crypto');

const OWNER_EMAIL = process.env.OWNER_EMAIL || 'hempstonetinga@gmail.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://stampke.vercel.app';

// ── Welcome + verify email (Lovable-inspired style) ─────────────────────────
const buildWelcomeEmail = (name, verifyUrl) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Welcome to StampKE</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#18181b">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

        <!-- Logo Header -->
        <tr>
          <td align="center" style="padding:0 0 32px">
            <div style="display:inline-block;background:#18181b;border-radius:14px;padding:14px 28px">
              <span style="color:#ffffff;font-size:24px;font-weight:900;letter-spacing:-0.5px">StampKE</span>
              <span style="color:#71717a;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;display:block;margin-top:2px">Digital Authority Platform</span>
            </div>
          </td>
        </tr>

        <!-- Hero Card -->
        <tr>
          <td style="background:#ffffff;border-radius:20px;padding:48px 48px 40px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">

            <h1 style="font-size:28px;font-weight:900;color:#18181b;margin:0 0 12px;line-height:1.2">
              Welcome to StampKE.
            </h1>
            <p style="font-size:16px;color:#52525b;line-height:1.7;margin:0 0 28px">
              Only a fraction of Kenyan businesses have digital document authority — and most brilliant ideas get slowed down by paperwork, manual stamps, and chasing signatures. So we built StampKE to change that. <strong style="color:#18181b">Now you're part of that future.</strong>
            </p>

            <!-- CTA Button -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 36px">
              <tr>
                <td>
                  <a href="${verifyUrl}" style="display:inline-block;background:#18181b;color:#ffffff;padding:15px 36px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.2px">
                    ✅ Verify your email &rarr;
                  </a>
                  <p style="font-size:12px;color:#a1a1aa;margin:10px 0 0">
                    This link expires in <strong>24 hours</strong>. Unverified accounts are automatically removed.
                  </p>
                </td>
              </tr>
            </table>

            <hr style="border:none;border-top:1px solid #f4f4f5;margin:0 0 36px"/>

            <!-- Meet StampKE section -->
            <h2 style="font-size:18px;font-weight:800;color:#18181b;margin:0 0 8px">
              Meet StampKE: Your Digital Authority Platform
            </h2>
            <p style="font-size:14px;color:#52525b;line-height:1.7;margin:0 0 28px">
              StampKE is your all-in-one partner for turning paper-heavy workflows into fast, legally-binding digital operations — built for Kenyan law firms, enterprises, and institutions.
            </p>

            <!-- Features -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
              ${[
                ['✍️','eSign &amp; Stamp','Place legally-binding signatures and official digital stamps on any document. KICA-compliant.'],
                ['🧾','Smart Invoice','Create, send, and track professional invoices with M-Pesa payment integration. Get paid faster.'],
                ['📄','Document Hub','Generate contracts, letters, and PDFs from templates instantly — no design skills needed.'],
                ['👷','Recruit &amp; Track','Find vetted workers for errands, gigs, and projects across Kenya. Track them live.'],
                ['👥','Client Manager','Manage clients, leads, and follow-ups — a lightweight CRM built for Kenyan businesses.'],
              ].map(([icon, title, desc]) => `
              <tr>
                <td style="padding:0 0 16px">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #f4f4f5;border-radius:12px;padding:16px 20px">
                    <tr>
                      <td width="36" style="font-size:22px;vertical-align:top;padding-right:14px">${icon}</td>
                      <td>
                        <strong style="font-size:14px;color:#18181b;display:block;margin-bottom:4px">${title}</strong>
                        <span style="font-size:13px;color:#71717a;line-height:1.5">${desc}</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`).join('')}
            </table>

            <!-- Subscription callout -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:20px 24px;margin-bottom:32px">
              <tr>
                <td>
                  <strong style="font-size:14px;color:#0369a1;display:block;margin-bottom:6px">🎁 Your 7-day free trial is active</strong>
                  <span style="font-size:13px;color:#0c4a6e;line-height:1.6">Explore every feature free for 7 days. After your trial, choose a plan that fits your business:</span>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px">
                    ${[
                      ['Free','KES 0/mo','3 envelopes · Basic stamps'],
                      ['Pro','KES 2,500/mo','Unlimited signing · AI features · Priority support'],
                      ['Enterprise','Custom','Team accounts · API access · Custom branding'],
                    ].map(([plan, price, features]) => `
                    <tr>
                      <td style="padding:4px 0">
                        <span style="font-size:13px;color:#18181b;font-weight:700">${plan}</span>
                        <span style="font-size:12px;color:#71717a;margin-left:8px">${price}</span>
                        <span style="font-size:12px;color:#71717a;display:block;margin-left:0">${features}</span>
                      </td>
                    </tr>`).join('')}
                  </table>
                  <a href="${FRONTEND_URL}?section=pricing" style="display:inline-block;margin-top:14px;background:#0369a1;color:#ffffff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700">View Plans &rarr;</a>
                </td>
              </tr>
            </table>

            <!-- Getting started -->
            <h3 style="font-size:16px;font-weight:800;color:#18181b;margin:0 0 12px">Getting started with StampKE:</h3>
            <ul style="margin:0 0 28px;padding-left:20px;color:#52525b;font-size:14px;line-height:2">
              <li>Verify your email using the button above, then sign in</li>
              <li>Upload your first document and place a signature or stamp</li>
              <li>Invite co-signers and send your first envelope</li>
              <li>Set up your digital stamp in the Stamp Designer</li>
              <li>Or create your first invoice and send it to a client</li>
            </ul>

            <p style="font-size:14px;color:#52525b;line-height:1.7;margin:0 0 28px">
              We're excited to see what you build. If you ever have questions or need help, reply to this email — I read every one personally.
            </p>
            <p style="font-size:14px;color:#52525b;line-height:1.7;margin:0">
              Together, we're building a future where every Kenyan business operates with full digital authority — and we're thrilled to have you along for the journey.
            </p>
            <p style="font-size:14px;color:#18181b;font-weight:700;margin:24px 0 0">Let's prove it's possible!</p>

            <hr style="border:none;border-top:1px solid #f4f4f5;margin:32px 0"/>

            <!-- Signature -->
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td width="52" style="vertical-align:top;padding-right:14px">
                  <div style="width:48px;height:48px;background:#18181b;border-radius:50%;text-align:center;line-height:48px;color:#ffffff;font-weight:900;font-size:16px">HT</div>
                </td>
                <td>
                  <strong style="font-size:14px;color:#18181b;display:block">Hempstone Tinga</strong>
                  <span style="font-size:13px;color:#71717a">CEO &amp; Founder, StampKE</span><br/>
                  <a href="mailto:hempstonetinga@gmail.com" style="font-size:12px;color:#71717a;text-decoration:none">hempstonetinga@gmail.com</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:28px 0 0;text-align:center">
            <p style="font-size:12px;color:#a1a1aa;margin:0 0 8px">
              We sent this email to <strong>${'${to}'}</strong> because you signed up for StampKE.
            </p>
            <p style="font-size:12px;color:#a1a1aa;margin:0 0 16px">
              <a href="${FRONTEND_URL}/terms" style="color:#a1a1aa;text-decoration:underline">Terms</a>
              &nbsp;&nbsp;·&nbsp;&nbsp;
              <a href="${FRONTEND_URL}/privacy" style="color:#a1a1aa;text-decoration:underline">Privacy</a>
              &nbsp;&nbsp;·&nbsp;&nbsp;
              <a href="${FRONTEND_URL}/unsubscribe" style="color:#a1a1aa;text-decoration:underline">Unsubscribe</a>
            </p>
            <p style="font-size:11px;color:#d4d4d8;margin:0">
              &copy; ${new Date().getFullYear()} StampKE &middot; Nairobi, Kenya
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

const register = async (req, res, { userModel }) => {
  const { error, value } = Joi.object({
    name: Joi.string().min(2).max(80).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('business', 'worker').default('business'),
    company: Joi.string().max(120).allow('').optional(),
    phone: Joi.string().allow('').optional(),
  }).validate(req.body);

  if (error)
    return res.status(400).json({ success: false, result: null, message: error.details[0].message });

  const emailLower = value.email.toLowerCase();

  if (emailLower === OWNER_EMAIL.toLowerCase())
    return res.status(403).json({ success: false, result: null, message: 'This account cannot be registered.' });

  const { data: existing, error: existError } = await supabase
    .from('users')
    .select('id')
    .eq('email', emailLower)
    .eq('removed', false)
    .maybeSingle();

  if (existing)
    return res.status(409).json({ success: false, result: null, message: 'An account with this email already exists.' });

  const emailVerifyToken = crypto.randomBytes(32).toString('hex');
  const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  const now = new Date();

  // Create User in Supabase
  const { data: user, error: userError } = await supabase
    .from('users')
    .insert([{
      name: value.name,
      email: emailLower,
      company: value.company || '',
      phone: value.phone || '',
      role: value.role,
      enabled: true,
      email_verified: false,
      email_verify_token: emailVerifyToken,
      email_verify_expires: emailVerifyExpires.toISOString(),
      plan: value.role === 'business' ? 'trial' : 'free',
      trial_started_at: value.role === 'business' ? now.toISOString() : null,
      trial_ends_at: value.role === 'business' ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() : null,
      removed: false,
    }])
    .select()
    .single();

  if (userError) return res.status(400).json({ success: false, message: userError.message });

  const salt = shortid.generate();
  const passwordHash = bcrypt.hashSync(salt + value.password);

  const { error: passError } = await supabase
    .from('user_passwords')
    .insert([{
      user_id: user.id,
      password_hash: passwordHash,
      salt: salt,
    }]);

  if (passError) {
    // Cleanup user if password creation fails
    await supabase.from('users').delete().eq('id', user.id);
    return res.status(500).json({ success: false, message: passError.message });
  }

  const verifyUrl = `${FRONTEND_URL}/api/verify-email?token=${emailVerifyToken}&id=${user.id}`;

  try {
    await sendEmail({
      to: value.email,
      from: 'Hempstone Tinga @ StampKE <noreply@tomo.ke>',
      subject: 'Welcome to StampKE — please verify your email',
      html: buildWelcomeEmail(value.name, verifyUrl).replace('${to}', value.email),
    });

    sendEmail({
      to: OWNER_EMAIL,
      from: 'StampKE Alerts <noreply@tomo.ke>',
      subject: `[StampKE] New signup — ${value.name} (${value.role})`,
      html: `<p><b>${value.name}</b> (${emailLower}) signed up as <b>${value.role}</b>.</p>`,
    });
  } catch (err) {
    console.error('[Email] registration error:', err.message);
  }

  return res.status(201).json({
    success: true,
    result: { id: user.id, email: user.email, role: user.role, name: user.name },
    message: 'Account created! Check your email for a welcome message — verify within 24 hours.',
  });
};

module.exports = register;
