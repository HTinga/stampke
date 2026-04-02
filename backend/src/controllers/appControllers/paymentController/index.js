const supabase = require('@/config/supabase');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

// Helper to check if user is admin
const isAdmin = (user) => user.role === 'owner' || user.role === 'admin' || user.role === 'superadmin';

const methods = createCRUDController('Payment');

methods.create = async (req, res) => {
  const { invoice: invoiceId, client, amount, currency, date, paymentMethod, notes } = req.body;
  
  if (!invoiceId || !client || !amount)
    return res.status(400).json({ success: false, result: null, message: 'invoice, client and amount are required.' });

  // Get count for number
  const { count, error: countError } = await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true })
    .eq('created_by', req.user.id)
    .eq('removed', false);
  
  if (countError) return res.status(400).json({ success: false, message: countError.message });

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert([{
      invoice_id: invoiceId,
      client_id: client,
      amount,
      currency: currency || 'KES',
      date: date || new Date(),
      payment_method: paymentMethod,
      notes,
      number: (count || 0) + 1,
      created_by: req.user.id,
      removed: false
    }])
    .select()
    .single();

  if (paymentError)
    return res.status(400).json({ success: false, result: null, message: paymentError.message });

  // Update invoice credit and paymentStatus
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single();

  if (invoice) {
    const newCredit = (invoice.credit || 0) + amount;
    const remaining = (invoice.total || 0) - newCredit;
    const paymentStatus = remaining <= 0 ? 'paid' : newCredit > 0 ? 'partially' : 'unpaid';
    const status = paymentStatus === 'paid' ? 'paid' : invoice.status;
    const paidAt = paymentStatus === 'paid' ? new Date() : invoice.paid_at;

    await supabase
      .from('invoices')
      .update({
        credit: newCredit,
        payment_status: paymentStatus,
        status: status,
        paid_at: paidAt
      })
      .eq('id', invoiceId);
  }

  return res.status(200).json({ success: true, result: payment, message: 'Payment recorded successfully.' });
};

methods.summary = async (req, res) => {
  let query = supabase
    .from('payments')
    .select('currency, amount')
    .eq('removed', false);

  if (!isAdmin(req.user)) {
    query = query.eq('created_by', req.user.id);
  }

  const { data, error } = await query;

  if (error)
    return res.status(400).json({ success: false, result: null, message: error.message });

  // Group by currency
  const groupObj = {};
  data.forEach(p => {
    const curr = p.currency || 'KES';
    if (!groupObj[curr]) groupObj[curr] = { _id: curr, total: 0, count: 0 };
    groupObj[curr].total += (p.amount || 0);
    groupObj[curr].count += 1;
  });

  return res.status(200).json({ success: true, result: Object.values(groupObj), message: 'Payment summary.' });
};

module.exports = methods;

