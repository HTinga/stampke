const bcrypt   = require('bcryptjs');
const Joi      = require('joi');
const mongoose = require('mongoose');
const shortid  = require('shortid');
const { Resend } = require('resend');

const OWNER_EMAIL = process.env.OWNER_EMAIL || 'hempstonetinga@gmail.com';

const register = async (req, res, { userModel }) => {
  const UserPassword = mongoose.model(userModel + 'Password');
  const User         = mongoose.model(userModel);

  const { error, value } = Joi.object({
    name:     Joi.string().min(2).max(80).required(),
    email:    Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role:     Joi.string().valid('recruiter', 'worker').default('recruiter'),
    company:  Joi.string().max(120).allow('').optional(),
    phone:    Joi.string().allow('').optional(),
  }).validate(req.body);

  if (error)
    return res.status(400).json({ success: false, result: null, message: error.details[0].message });

  const existing = await User.findOne({ email: value.email.toLowerCase(), removed: false });
  if (existing)
    return res.status(409).json({
      success: false, result: null, message: 'An account with this email already exists.',
    });

  // Owner email auto-activates as owner role
  const isOwner = value.email.toLowerCase() === OWNER_EMAIL.toLowerCase();

  const user = await new User({
    name:    value.name,
    email:   value.email.toLowerCase(),
    company: value.company,
    phone:   value.phone,
    role:    isOwner ? 'owner' : value.role,
    enabled: isOwner,   // owner immediately active; others pending
    removed: false,
  }).save();

  // Hash and store password
  const salt           = shortid.generate();
  const hashedPassword = bcrypt.hashSync(salt + value.password);
  await new UserPassword({ user: user._id, password: hashedPassword, salt, removed: false }).save();

  // Notify owner of new signup (non-blocking)
  if (!isOwner) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from:    'Tomo Platform <noreply@tomo.ke>',
        to:      OWNER_EMAIL,
        subject: `[Tomo] New ${value.role} signup — ${value.name}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px">
            <h2 style="color:#1f6feb">New user signup</h2>
            <p><strong>Name:</strong> ${value.name}</p>
            <p><strong>Email:</strong> ${value.email}</p>
            <p><strong>Role:</strong> ${value.role}</p>
            <p>Log in to the Admin Panel to activate this account.</p>
          </div>`,
      });
    } catch (e) {
      console.error('[Email] register notify error:', e.message);
    }
  }

  return res.status(201).json({
    success: true,
    result: null,
    message: isOwner
      ? 'Owner account created. You can sign in immediately.'
      : 'Registration successful! Your account is pending activation. You will receive an email once approved.',
  });
};

module.exports = register;
