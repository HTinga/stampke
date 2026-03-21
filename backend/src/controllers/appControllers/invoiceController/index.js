const mongoose             = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const { Resend }           = require('resend');

const Invoice = mongoose.model('Invoice');
const methods = createCRUDController('Invoice');

// Override create — attach createdBy, auto-number, calculate totals
methods.create = async (req, res) => {
  const body = { ...req.body, createdBy: req.user._id, removed: false };
  if (!body.clientName)
    return res.status(400).json({ success: false, result: null, message: 'Client name is required.' });

  // Auto-number within this user's invoices
  if (!body.invoiceNumber) {
    const count = await Invoice.countDocuments({ createdBy: req.user._id, removed: false });
    body.invoiceNumber = `INV-${String(count + 1).padStart(4, '0')}`;
    body.number        = count + 1;
  }
  body.year = new Date().getFullYear();
  body.date = body.date || new Date();

  const result = await new Invoice(body).save();
  return res.status(200).json({ success: true, result, message: 'Invoice created successfully.' });
};

// Override list — scope by user, auto-mark overdue
methods.list = async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.items) || 10;
  const skip  = (page - 1) * limit;
  const { q, fields, filter: f, equal, sortBy = 'created', sortValue = -1 } = req.query;

  const base = req.user.role === 'owner' || req.user.role === 'admin'
    ? { removed: false }
    : { removed: false, createdBy: req.user._id };

  if (f && equal) base[f] = equal;
  if (q && fields)
    base.$or = fields.split(',').map((field) => ({ [field]: { $regex: q, $options: 'i' } }));

  // Auto-mark overdue
  await Invoice.updateMany(
    { ...base, status: 'sent', expiredDate: { $lt: new Date() } },
    { status: 'overdue', isOverdue: true }
  );

  const [result, count] = await Promise.all([
    Invoice.find(base).skip(skip).limit(limit).sort({ [sortBy]: parseInt(sortValue) }),
    Invoice.countDocuments(base),
  ]);
  const pages = Math.ceil(count / limit);
  return res.status(count > 0 ? 200 : 203).json({
    success: true, result, pagination: { page, pages, count },
    message: count > 0 ? 'Invoices found.' : 'No invoices yet.',
  });
};

// PATCH /api/invoice/paid/:id
methods.markPaid = async (req, res) => {
  const result = await Invoice.findOneAndUpdate(
    { _id: req.params.id, removed: false },
    { status: 'paid', paymentStatus: 'paid', paidAt: new Date() },
    { new: true }
  );
  if (!result)
    return res.status(404).json({ success: false, result: null, message: 'Invoice not found.' });
  return res.status(200).json({ success: true, result, message: 'Invoice marked as paid.' });
};

// POST /api/invoice/remind/:id — send email reminder to client
methods.sendReminder = async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, removed: false });
  if (!invoice)
    return res.status(404).json({ success: false, result: null, message: 'Invoice not found.' });
  if (!invoice.clientEmail)
    return res.status(400).json({ success: false, result: null, message: 'No client email on this invoice.' });

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from:    `${invoice.businessName || 'Tomo'} <noreply@tomo.ke>`,
      to:      invoice.clientEmail,
      subject: `Payment Reminder: ${invoice.invoiceNumber} — ${invoice.currency} ${invoice.total.toLocaleString()}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px">
          <h2>Payment Reminder</h2>
          <p>Hi ${invoice.clientName},</p>
          <p>Invoice <strong>${invoice.invoiceNumber}</strong> for 
             <strong>${invoice.currency} ${invoice.total.toLocaleString()}</strong> 
             is due on <strong>${new Date(invoice.expiredDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.</p>
          ${invoice.notes ? `<p>${invoice.notes}</p>` : ''}
          <p style="color:#888;font-size:12px">Reminder #${invoice.reminderCount + 1} — sent via Tomo</p>
        </div>`,
    });
  } catch (e) {
    console.error('[Email] reminder error:', e.message);
  }

  invoice.reminderCount  += 1;
  invoice.lastReminderAt  = new Date();
  if (invoice.status === 'draft') invoice.status = 'sent';
  await invoice.save();

  return res.status(200).json({
    success: true, result: invoice,
    message: `Reminder #${invoice.reminderCount} sent to ${invoice.clientName}.`,
  });
};

// Aggregated summary with payment totals
methods.summary = async (req, res) => {
  const base = req.user.role === 'owner' || req.user.role === 'admin'
    ? { removed: false }
    : { removed: false, createdBy: req.user._id };

  const agg = await Invoice.aggregate([
    { $match: base },
    {
      $facet: {
        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$total' } } }],
        byPayment: [{ $group: { _id: '$paymentStatus', count: { $sum: 1 }, total: { $sum: '$total' } } }],
        totalAll:  [{ $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$total' } } }],
      },
    },
  ]);

  const r          = agg[0] || {};
  const totalAll   = r.totalAll?.[0]  || { count: 0, total: 0 };
  const byStatus   = r.byStatus       || [];
  const byPayment  = r.byPayment      || [];

  const statusMap  = Object.fromEntries(byStatus.map((s) => [s._id, s]));
  const paymentMap = Object.fromEntries(byPayment.map((s) => [s._id, s]));

  return res.status(200).json({
    success: true,
    result: {
      total:       totalAll.count,
      totalAmount: totalAll.total,
      draft:       statusMap.draft?.count    || 0,
      sent:        statusMap.sent?.count     || 0,
      overdue:     statusMap.overdue?.count  || 0,
      paid:        statusMap.paid?.count     || 0,
      cancelled:   statusMap.cancelled?.count || 0,
      totalUnpaid: (paymentMap.unpaid?.total || 0) + (paymentMap.partially?.total || 0),
      totalPaid:   paymentMap.paid?.total    || 0,
    },
    message: 'Invoice summary.',
  });
};

module.exports = methods;
