const supabase = require('@/config/supabase');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const { Resend } = require('resend');

// Helper to check if user is admin
const isAdmin = (user) => user.role === 'owner' || user.role === 'admin' || user.role === 'superadmin';

const methods = createCRUDController('Invoice');

// Override create — attach createdBy, auto-number, calculate totals
methods.create = async (req, res) => {
  const { clientName, clientEmail, clientPhone, clientAddress, businessName, businessEmail, items, taxRate, discount, currency, date, expiredDate, notes, status } = req.body;
  
  if (!clientName)
    return res.status(400).json({ success: false, result: null, message: 'Client name is required.' });

  // Auto-number within this user's invoices
  let invoiceNumber = req.body.invoiceNumber;
  let number = req.body.number;
  
  if (!invoiceNumber) {
    const { count, error: countError } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', req.user.id)
      .eq('removed', false);
    
    if (countError) return res.status(400).json({ success: false, message: countError.message });
    
    number = (count || 0) + 1;
    invoiceNumber = `INV-${String(number).padStart(4, '0')}`;
  }

  const { data, error } = await supabase
    .from('invoices')
    .insert([{
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone,
      client_address: clientAddress,
      business_name: businessName,
      business_email: businessEmail,
      invoice_number: invoiceNumber,
      number: number,
      items: items || [],
      tax_rate: taxRate || 16,
      discount: discount || 0,
      currency: currency || 'KES',
      date: date || new Date(),
      expired_date: expiredDate || new Date(),
      notes,
      status: status || 'draft',
      created_by: req.user.id,
      removed: false
    }])
    .select()
    .single();

  if (error)
    return res.status(400).json({ success: false, result: null, message: error.message });

  return res.status(200).json({ success: true, result: data, message: 'Invoice created successfully.' });
};

// Override list — scope by user, auto-mark overdue
methods.list = async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.items) || 10;
  const skip  = (page - 1) * limit;
  const { q, fields, filter: f, equal, sortBy = 'created_at', sortValue = -1 } = req.query;

  let query = supabase
    .from('invoices')
    .select('*', { count: 'exact' })
    .eq('removed', false);

  if (!isAdmin(req.user)) {
    query = query.eq('created_by', req.user.id);
  }

  if (f && equal) query = query.eq(f, equal);
  if (q && fields) {
    const fieldsArray = fields.split(',');
    const orCondition = fieldsArray.map(field => `${field}.ilike.%${q}%`).join(',');
    query = query.or(orCondition);
  }

  // Auto-mark overdue (sync)
  const now = new Date().toISOString();
  await supabase
    .from('invoices')
    .update({ status: 'overdue', is_overdue: true })
    .eq('status', 'sent')
    .lt('expired_date', now)
    .eq('removed', false);

  const { data, count, error } = await query
    .order(sortBy, { ascending: parseInt(sortValue) === 1 })
    .range(skip, skip + limit - 1);

  if (error)
    return res.status(400).json({ success: false, result: [], message: error.message });

  const pages = Math.ceil((count || 0) / limit);
  return res.status((count || 0) > 0 ? 200 : 203).json({
    success: true,
    result: data,
    pagination: { page, pages, count: count || 0 },
    message: (count || 0) > 0 ? 'Invoices found.' : 'No invoices yet.',
  });
};

// PATCH /api/invoice/paid/:id
methods.markPaid = async (req, res) => {
  const { data, error } = await supabase
    .from('invoices')
    .update({ 
      status: 'paid', 
      payment_status: 'paid', 
      paid_at: new Date() 
    })
    .eq('id', req.params.id)
    .eq('removed', false)
    .select()
    .single();

  if (error || !data)
    return res.status(404).json({ success: false, result: null, message: 'Invoice not found.' });

  return res.status(200).json({ success: true, result: data, message: 'Invoice marked as paid.' });
};

// POST /api/invoice/remind/:id
methods.sendReminder = async (req, res) => {
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', req.params.id)
    .eq('removed', false)
    .single();

  if (error || !invoice)
    return res.status(404).json({ success: false, result: null, message: 'Invoice not found.' });
  
  if (!invoice.client_email)
    return res.status(400).json({ success: false, result: null, message: 'No client email on this invoice.' });

  const dueDate = invoice.expired_date
    ? new Date(invoice.expired_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'ASAP';

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from:    (invoice.business_name || 'Tomo') + ' <noreply@tomo.ke>',
      to:      invoice.client_email,
      subject: `Payment Reminder: ${invoice.invoice_number} — ${invoice.currency} ${invoice.total?.toLocaleString()}`,
      html: `<div style="font-family:sans-serif;max-width:480px"><h2>Payment Reminder</h2>`
          + `<p>Hi ${invoice.client_name},</p>`
          + `<p>Invoice <strong>${invoice.invoice_number}</strong> for `
          + `<strong>${invoice.currency} ${invoice.total?.toLocaleString()}</strong>`
          + ` is due on <strong>${dueDate}</strong>.</p>`
          + (invoice.notes ? `<p>${invoice.notes}</p>` : '')
          + `<p style="color:#888;font-size:12px">Reminder #${(invoice.reminder_count || 0) + 1} sent via Tomo</p></div>`,
    });
  } catch (e) {
    console.error('[Email] reminder error:', e.message);
  }

  const { data: updated } = await supabase
    .from('invoices')
    .update({
      reminder_count: (invoice.reminder_count || 0) + 1,
      last_reminder_at: new Date(),
      status: invoice.status === 'draft' ? 'sent' : invoice.status
    })
    .eq('id', invoice.id)
    .select()
    .single();

  return res.status(200).json({
    success: true,
    result: updated,
    message: `Reminder #${updated.reminder_count} sent to ${updated.client_name}.`,
  });
};

// Aggregated summary with payment totals
methods.summary = async (req, res) => {
  let query = supabase
    .from('invoices')
    .select('status, payment_status, total')
    .eq('removed', false);

  if (!isAdmin(req.user)) {
    query = query.eq('created_by', req.user.id);
  }

  const { data: allInvoices, error } = await query;

  if (error)
    return res.status(400).json({ success: false, result: null, message: error.message });

  const result = {
    total:       allInvoices.length,
    totalAmount: allInvoices.reduce((acc, inv) => acc + (inv.total || 0), 0),
    draft:       allInvoices.filter(inv => inv.status === 'draft').length,
    sent:        allInvoices.filter(inv => inv.status === 'sent').length,
    overdue:     allInvoices.filter(inv => inv.status === 'overdue').length,
    paid:        allInvoices.filter(inv => inv.status === 'paid').length,
    cancelled:   allInvoices.filter(inv => inv.status === 'cancelled').length,
    totalUnpaid: allInvoices.filter(inv => inv.payment_status === 'unpaid' || inv.payment_status === 'partially').reduce((acc, inv) => acc + (inv.total || 0), 0),
    totalPaid:   allInvoices.filter(inv => inv.payment_status === 'paid').reduce((acc, inv) => acc + (inv.total || 0), 0),
  };

  return res.status(200).json({
    success: true,
    result,
    message: 'Invoice summary.',
  });
};

module.exports = methods;

