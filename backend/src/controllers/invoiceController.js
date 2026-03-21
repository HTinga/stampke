const Invoice = require('../models/Invoice');
const { sendInvoiceReminder } = require('../services/email');

const autoNumber = async (userId) => {
  const count = await Invoice.countDocuments({ createdBy: userId });
  return `INV-${String(count + 1).padStart(4, '0')}`;
};

// ── Create invoice ───────────────────────────────────────────────────────────
exports.create = async (req, res) => {
  const data = req.body;
  if (!data.clientName) return res.status(400).json({ success: false, message: 'Client name is required.' });

  const invoiceNumber = data.invoiceNumber || (await autoNumber(req.user._id));
  const invoice = await Invoice.create({ ...data, invoiceNumber, createdBy: req.user._id });
  res.status(201).json({ success: true, invoice });
};

// ── List invoices ─────────────────────────────────────────────────────────────
exports.list = async (req, res) => {
  const { page = 1, limit = 30, status, search } = req.query;
  const filter = { removed: false };
  if (req.user.role !== 'admin') filter.createdBy = req.user._id;
  if (status) filter.status = status;
  if (search) filter.$or = [
    { clientName: { $regex: search, $options: 'i' } },
    { invoiceNumber: { $regex: search, $options: 'i' } },
  ];

  // Auto-mark overdue
  await Invoice.updateMany(
    { ...filter, status: 'sent', dueDate: { $lt: new Date() } },
    { status: 'overdue' }
  );

  const invoices = await Invoice.find(filter)
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));
  const total = await Invoice.countDocuments(filter);

  res.json({ success: true, invoices, total, page: Number(page) });
};

// ── Read single invoice ──────────────────────────────────────────────────────
exports.read = async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice || invoice.removed) return res.status(404).json({ success: false, message: 'Invoice not found.' });
  res.json({ success: true, invoice });
};

// ── Update invoice ───────────────────────────────────────────────────────────
exports.update = async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });
  Object.assign(invoice, req.body);
  await invoice.save();
  res.json({ success: true, invoice });
};

// ── Mark paid ────────────────────────────────────────────────────────────────
exports.markPaid = async (req, res) => {
  const invoice = await Invoice.findByIdAndUpdate(
    req.params.id,
    { status: 'paid', paidAt: new Date() },
    { new: true }
  );
  if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });
  res.json({ success: true, invoice });
};

// ── Send reminder ─────────────────────────────────────────────────────────────
exports.sendReminder = async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });
  if (!invoice.clientEmail) return res.status(400).json({ success: false, message: 'No client email on this invoice.' });

  await sendInvoiceReminder({
    invoice,
    clientEmail: invoice.clientEmail,
    clientName: invoice.clientName,
  });

  invoice.reminderCount += 1;
  invoice.lastReminderAt = new Date();
  invoice.status = invoice.status === 'draft' ? 'sent' : invoice.status;
  await invoice.save();

  res.json({ success: true, message: `Reminder #${invoice.reminderCount} sent.`, invoice });
};

// ── Delete (soft) ─────────────────────────────────────────────────────────────
exports.remove = async (req, res) => {
  await Invoice.findByIdAndUpdate(req.params.id, { removed: true });
  res.json({ success: true, message: 'Invoice deleted.' });
};

// ── Summary stats ─────────────────────────────────────────────────────────────
exports.summary = async (req, res) => {
  const base = req.user.role === 'admin' ? { removed: false } : { createdBy: req.user._id, removed: false };
  const [draft, sent, paid, overdue, cancelled] = await Promise.all([
    Invoice.countDocuments({ ...base, status: 'draft' }),
    Invoice.countDocuments({ ...base, status: 'sent' }),
    Invoice.countDocuments({ ...base, status: 'paid' }),
    Invoice.countDocuments({ ...base, status: 'overdue' }),
    Invoice.countDocuments({ ...base, status: 'cancelled' }),
  ]);

  const unpaidAgg = await Invoice.aggregate([
    { $match: { ...base, status: { $in: ['sent', 'overdue'] } } },
    { $group: { _id: null, total: { $sum: '$total' } } },
  ]);
  const paidAgg = await Invoice.aggregate([
    { $match: { ...base, status: 'paid' } },
    { $group: { _id: null, total: { $sum: '$total' } } },
  ]);

  res.json({
    success: true,
    summary: {
      draft, sent, paid, overdue, cancelled,
      totalUnpaid: unpaidAgg[0]?.total || 0,
      totalPaid:   paidAgg[0]?.total || 0,
    },
  });
};
