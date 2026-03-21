const mongoose             = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

const Payment = mongoose.model('Payment');
const Invoice = mongoose.model('Invoice');
const methods = createCRUDController('Payment');

methods.create = async (req, res) => {
  const body = { ...req.body, createdBy: req.user._id, removed: false };
  if (!body.invoice || !body.client || !body.amount)
    return res.status(400).json({ success: false, result: null, message: 'invoice, client and amount are required.' });

  const count    = await Payment.countDocuments({ createdBy: req.user._id, removed: false });
  body.number    = count + 1;

  const result = await new Payment(body).save();

  // Update invoice credit and paymentStatus
  const invoice = await Invoice.findById(body.invoice);
  if (invoice) {
    invoice.credit = (invoice.credit || 0) + body.amount;
    const remaining = invoice.total - invoice.credit;
    invoice.paymentStatus = remaining <= 0 ? 'paid' : invoice.credit > 0 ? 'partially' : 'unpaid';
    if (invoice.paymentStatus === 'paid') { invoice.status = 'paid'; invoice.paidAt = new Date(); }
    await invoice.save();
  }

  return res.status(200).json({ success: true, result, message: 'Payment recorded successfully.' });
};

methods.summary = async (req, res) => {
  const base = req.user.role === 'owner' || req.user.role === 'admin'
    ? { removed: false }
    : { removed: false, createdBy: req.user._id };

  const agg = await Payment.aggregate([
    { $match: base },
    { $group: { _id: '$currency', total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);

  return res.status(200).json({ success: true, result: agg, message: 'Payment summary.' });
};

module.exports = methods;
