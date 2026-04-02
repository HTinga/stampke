'use strict';
const sendEmail = require('@/utils/sendEmail');
const supabase = require('@/config/supabase');
const bcrypt = require('bcryptjs');
const shortid = require('shortid');

const OWNER_EMAIL = process.env.OWNER_EMAIL || 'hempstonetinga@gmail.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://stampke.vercel.app';

// GET /api/user/me
const me = async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.user.id)
    .eq('removed', false)
    .single();

  if (error || !user) return res.status(404).json({ success: false, message: 'User not found.' });

  const now = new Date();
  const trialEndsAt = user.trial_ends_at ? new Date(user.trial_ends_at) : null;
  const trialActive = user.plan === 'trial' && trialEndsAt && now < trialEndsAt;
  const trialDaysLeft = trialActive ? Math.max(0, Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24))) : 0;

  // Check if admin approval is still valid
  const approvalExpiresAt = user.approval_expires_at ? new Date(user.approval_expires_at) : null;
  const adminApprovalActive = user.admin_approved && approvalExpiresAt && now < approvalExpiresAt;
  const approvalDaysLeft = adminApprovalActive
    ? Math.max(0, Math.ceil((approvalExpiresAt - now) / (1000 * 60 * 60 * 24)))
    : 0;

  return res.status(200).json({
    success: true,
    result: {
      ...user,
      trialActive,
      trialDaysLeft,
      adminApproved: user.admin_approved || false,
      adminApprovalActive,
      approvalDaysLeft,
      approvalExpiresAt: user.approval_expires_at,
    },
    message: 'Profile found.',
  });
};

// PATCH /api/user/profile
const updateProfile = async (req, res) => {
  const { name, phone, company, photo } = req.body;
  const { data, error } = await supabase
    .from('users')
    .update({ name, phone, company, photo, updated_at: new Date() })
    .eq('id', req.user.id)
    .select()
    .single();

  if (error) return res.status(400).json({ success: false, message: error.message });
  return res.status(200).json({ success: true, result: data, message: 'Profile updated.' });
};

// GET /api/user/list
const list = async (req, res) => {
  const { status, role, page = 1, items = 50 } = req.query;
  const limit = parseInt(items);
  const skip = (parseInt(page) - 1) * limit;

  let query = supabase
    .from('users')
    .select('*', { count: 'exact' })
    .eq('removed', false);

  if (req.user.role === 'admin') {
    query = query.in('role', ['business', 'worker']);
  } else if (role) {
    query = query.eq('role', role);
  }

  if (status === 'active')   query = query.eq('enabled', true);
  if (status === 'pending')  query = query.eq('enabled', false);

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(skip, skip + limit - 1);

  if (error) return res.status(400).json({ success: false, message: error.message });

  return res.status(200).json({
    success: true,
    result: data,
    pagination: { page: parseInt(page), pages: Math.ceil((count || 0) / limit), count: count || 0 },
    message: 'Users found.',
  });
};

// GET /api/user/read/:id
const read = async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.params.id)
    .eq('removed', false)
    .single();

  if (error || !data) return res.status(404).json({ success: false, result: null, message: 'User not found.' });
  return res.status(200).json({ success: true, result: data, message: 'User found.' });
};

// PATCH /api/user/activate/:id
const activate = async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .update({ enabled: true, updated_at: new Date() })
    .eq('id', req.params.id)
    .eq('removed', false)
    .select()
    .single();

  if (error || !user) return res.status(404).json({ success: false, result: null, message: 'User not found.' });

  try {
    await sendEmail({
      to: user.email,
      subject: 'StampKE Account Active!',
      html: `<p>Hi ${user.name}, your account has been activated. <a href="${FRONTEND_URL}">Sign in to StampKE</a></p>`,
      from: 'StampKE <noreply@stampke.co.ke>'
    });
  } catch (err) {
    console.error('[Email] activation error:', err.message);
  }

  return res.status(200).json({ success: true, result: user, message: `${user.name} activated.` });
};

// PATCH /api/user/suspend/:id
const suspend = async (req, res) => {
  const { reason } = req.body;
  if (req.params.id === req.user.id)
    return res.status(403).json({ success: false, result: null, message: 'Cannot suspend yourself.' });

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.params.id)
    .eq('removed', false)
    .single();

  if (error || !user) return res.status(404).json({ success: false, result: null, message: 'User not found.' });

  if (user.email.toLowerCase() === OWNER_EMAIL.toLowerCase())
    return res.status(403).json({ success: false, result: null, message: 'Cannot suspend the platform owner.' });

  if (req.user.role === 'admin' && ['superadmin', 'admin'].includes(user.role))
    return res.status(403).json({ success: false, result: null, message: 'Insufficient permissions.' });

  const { error: updateError } = await supabase
    .from('users')
    .update({ enabled: false, updated_at: new Date() })
    .eq('id', user.id);

  if (updateError) return res.status(400).json({ success: false, message: updateError.message });

  // Invalidate tokens/sessions in user_passwords if needed
  await supabase
    .from('user_passwords')
    .update({ reset_token: null })
    .eq('user_id', user.id);

  return res.status(200).json({ success: true, result: user, message: `${user.name} suspended.` });
};

// DELETE /api/user/delete/:id
const remove = async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.params.id)
    .eq('removed', false)
    .single();

  if (error || !user) return res.status(404).json({ success: false, result: null, message: 'User not found.' });

  if (user.email.toLowerCase() === OWNER_EMAIL.toLowerCase())
    return res.status(403).json({ success: false, result: null, message: 'Cannot delete the platform owner.' });

  if (req.user.role === 'admin' && ['superadmin', 'admin'].includes(user.role))
    return res.status(403).json({ success: false, result: null, message: 'Insufficient permissions.' });

  await supabase
    .from('users')
    .update({ removed: true, updated_at: new Date() })
    .eq('id', req.params.id);

  return res.status(200).json({ success: true, result: {}, message: 'User deleted.' });
};

// POST /api/user/create-admin
const createAdmin = async (req, res) => {
  const { name, email, password, role = 'admin', adminPermissions = [] } = req.body;
  const isSuperAdmin = req.user.role === 'superadmin';
  const isEnterprise = req.user.plan === 'enterprise' || req.user.plan === 'business'; // 'business' in our code maps to the Enterprise level subscription

  if (!isSuperAdmin && !isEnterprise) {
    return res.status(403).json({ success: false, message: 'Only Enterprise level accounts can create sub-users.' });
  }

  if (!name || !email || !password)
    return res.status(400).json({ success: false, message: 'name, email and password are required.' });

  // ── Enforce 5-user limit for Enterprise ─────────────────────────────────────
  if (!isSuperAdmin) {
    const { count, error: countError } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', req.user.id)
      .eq('removed', false);

    if (countError) throw countError;
    if (count >= 5) {
      return res.status(403).json({ success: false, message: 'You have reached your limit of 5 sub-users. Upgrade to a Custom plan for more.' });
    }
  }

  const emailLower = email.toLowerCase();
  const { data: existing } = await supabase.from('users').select('id').eq('email', emailLower).eq('removed', false).maybeSingle();
  if (existing) return res.status(409).json({ success: false, message: 'Email already registered.' });

  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert([{
      name,
      email: emailLower,
      role: isSuperAdmin ? (role || 'admin') : 'admin',
      enabled: true,
      email_verified: true,
      admin_permissions: adminPermissions,
      plan: 'business',
      created_by: req.user.id,
      removed: false,
    }])
    .select()
    .single();

  if (createError) return res.status(400).json({ success: false, message: createError.message });

  const salt = shortid.generate();
  const passwordHash = bcrypt.hashSync(salt + password);
  await supabase.from('user_passwords').insert([{ user_id: newUser.id, password_hash: passwordHash, salt }]);

  return res.status(200).json({ success: true, result: newUser, message: `User ${name} created successfully.` });
};

// PATCH /api/user/grant-plan/:id
const grantPlan = async (req, res) => {
  if (req.user.role !== 'superadmin')
    return res.status(403).json({ success: false, result: null, message: 'Only superadmin can grant access.' });

  const { plan, approvalMonths, approvalExpiresAt, adminApproved } = req.body;

  if (!['starter', 'pro', 'business', 'trial', 'free'].includes(plan))
    return res.status(400).json({ success: false, result: null, message: 'Invalid plan.' });

  let expiresAt = approvalExpiresAt ? new Date(approvalExpiresAt) : null;
  if (!expiresAt && approvalMonths) {
    expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + parseInt(approvalMonths, 10));
  }

  const { data: user, error } = await supabase
    .from('users')
    .update({
      plan,
      plan_activated_at: new Date(),
      admin_approved: adminApproved !== false,
      approval_expires_at: expiresAt ? expiresAt.toISOString() : null,
      updated_at: new Date()
    })
    .eq('id', req.params.id)
    .eq('removed', false)
    .select()
    .single();

  if (error || !user) return res.status(404).json({ success: false, result: null, message: 'User not found.' });

  const expiryStr = expiresAt
    ? expiresAt.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'indefinitely';

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'StampKE <noreply@stampke.co.ke>',
          to: [user.email],
          subject: `✅ Your StampKE ${plan.charAt(0).toUpperCase() + plan.slice(1)} access has been approved`,
          html: `<p>Hi ${user.name}, your StampKE ${plan} plan has been approved until ${expiryStr}. <a href="${FRONTEND_URL}">Sign in to get started</a></p>`,
        }),
      });
    } catch (err) {
      console.warn('[grant-plan] email error:', err.message);
    }
  }

  return res.status(200).json({ success: true, result: user, message: `Access approved: ${plan} plan until ${expiryStr}.` });
};

// PATCH /api/user/admin-permissions/:id
const updateAdminPermissions = async (req, res) => {
  if (req.user.role !== 'superadmin')
    return res.status(403).json({ success: false, result: null, message: 'Only superadmin can update admin permissions.' });
  
  const { adminPermissions } = req.body;
  const { data, error } = await supabase
    .from('users')
    .update({ admin_permissions: adminPermissions, updated_at: new Date() })
    .eq('id', req.params.id)
    .eq('role', 'admin')
    .eq('removed', false)
    .select()
    .single();

  if (error || !data) return res.status(404).json({ success: false, message: 'Admin not found.' });
  return res.status(200).json({ success: true, result: data, message: 'Permissions updated.' });
};

// POST /api/user/usage
const trackUsage = async (req, res) => {
  const { feature } = req.body;
  
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.user.id)
    .single();

  if (error || !user) return res.status(404).json({ success: false, message: 'User not found.' });

  const now = new Date();
  const trialEnds = user.trial_ends_at ? new Date(user.trial_ends_at) : null;
  const isTrial = user.plan === 'trial' || (user.plan === 'starter' && trialEnds && now < trialEnds);
  const isPaidPermanently = ['pro','business'].includes(user.plan) || (user.plan === 'starter' && (!trialEnds || now >= trialEnds));
  
  // Enterprise/Pro get unlimited access
  if (isPaidPermanently) return res.status(200).json({ success: true, result: { allowed: true, remaining: 999 }, message: 'Premium user.' });

  const LIMITS = { 
    esign: 1, 
    stamp: 1, 
    invoice: 0, 
    pdf: 0, 
    summarizer: 0, 
    assistant: 999, // VA is always open
    scrape: 0 
  };

  const freeUsage = user.free_usage || {};
  const current = freeUsage[feature] || 0;
  const limit = LIMITS[feature] !== undefined ? LIMITS[feature] : 0;

  if (current >= limit) {
    return res.status(200).json({ 
      success: true, 
      result: { allowed: false, remaining: 0, limit }, 
      message: limit === 1 ? `Free ${feature} limit (1 use) reached. Please upgrade.` : `The ${feature} feature is locked for trial users.`
    });
  }

  const updatedUsage = { ...freeUsage, [feature]: current + 1 };
  await supabase.from('users').update({ free_usage: updatedUsage }).eq('id', user.id);

  return res.status(200).json({ success: true, result: { allowed: true, remaining: limit - current - 1, limit, used: current + 1 }, message: 'Usage recorded.' });
};

// GET /api/user/usage
const getUsage = async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.user.id)
    .single();

  if (error || !user) return res.status(404).json({ success: false, message: 'User not found.' });

  const now = new Date();
  const trialEnds = user.trial_ends_at ? new Date(user.trial_ends_at) : null;
  const isTrial = user.plan === 'trial' || (user.plan === 'starter' && trialEnds && now < trialEnds);
  const isPaidPermanently = ['pro','business'].includes(user.plan) || (user.plan === 'starter' && (!trialEnds || now >= trialEnds));
  
  const usage = user.free_usage || {};
  const features = ['esign', 'stamp', 'invoice', 'pdf', 'summarizer', 'assistant', 'scrape'];
  const result = { isPaid: isPaidPermanently, isTrial };

  const LIMITS = { 
    esign: 1, 
    stamp: 1, 
    invoice: 0, 
    pdf: 0, 
    summarizer: 0, 
    assistant: 999, 
    scrape: 0 
  };

  features.forEach(f => {
    const used = usage[f] || 0;
    const limit = isPaidPermanently ? 999 : (LIMITS[f] !== undefined ? LIMITS[f] : 0);
    result[f] = { used, limit, remaining: Math.max(0, limit - used) };
  });

  return res.status(200).json({ success: true, result, message: 'Usage fetched.' });
};

// POST /api/user/usage/bulk
const trackBulkUsage = async (req, res) => {
  const { feature, count = 1 } = req.body;
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.user.id)
    .single();

  if (error || !user) return res.status(404).json({ success: false, message: 'User not found.' });

  const now = new Date();
  const trialEnds = user.trial_ends_at ? new Date(user.trial_ends_at) : null;
  const isPaid = ['starter','pro','business'].includes(user.plan) || (user.plan === 'trial' && trialEnds && now < trialEnds);

  const freeUsage = user.free_usage || {};
  const current = freeUsage[feature] || 0;

  if (isPaid) {
    const updatedUsage = { ...freeUsage, [feature]: current + count };
    await supabase.from('users').update({ free_usage: updatedUsage }).eq('id', user.id);
    return res.status(200).json({ success: true, result: { allowed: true, remaining: 999 }, message: 'Premium usage recorded.' });
  }

  const limit = 1;
  if (current >= limit) return res.status(200).json({ success: true, result: { allowed: false, remaining: 0, limit }, message: `Free ${feature} limit reached. Please upgrade.` });

  const updatedUsage = { ...freeUsage, [feature]: current + count };
  await supabase.from('users').update({ free_usage: updatedUsage }).eq('id', user.id);
  return res.status(200).json({ success: true, result: { allowed: true, remaining: Math.max(0, limit - current - count), limit, used: current + count }, message: 'Bulk usage recorded.' });
};

module.exports = { list, activate, suspend, delete: remove, read, updateProfile, me, createAdmin, grantPlan, updateAdminPermissions, trackUsage, getUsage, trackBulkUsage };
