const Client = require('../models/Client');
const Invoice = require('../models/Invoice');

// ── Create client ────────────────────────────────────────────────────────────
exports.create = async (req, res) => {
  const { name, email, phone, company, address, country, city, notes, source, status, tags } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Client name is required.' });

  const client = await Client.create({
    name, email, phone, company, address,
    country: country || 'Kenya', city, notes,
    source: source || 'direct',
    status: status || 'active',
    tags: tags || [],
    createdBy: req.user._id,
  });
  res.status(201).json({ success: true, client });
};

// ── List clients (paginated + search) ───────────────────────────────────────
exports.list = async (req, res) => {
  const { page = 1, limit = 30, search, status, source } = req.query;
  const filter = { removed: false };

  // Recruiters only see their own clients; admins see all
  if (req.user.role !== 'admin') filter.createdBy = req.user._id;
  if (status) filter.status = status;
  if (source) filter.source = source;
  if (search) {
    filter.$or = [
      { name:    { $regex: search, $options: 'i' } },
      { email:   { $regex: search, $options: 'i' } },
      { phone:   { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
    ];
  }

  const clients = await Client.find(filter)
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));
  const total = await Client.countDocuments(filter);

  res.json({ success: true, clients, total, page: Number(page), pages: Math.ceil(total / limit) });
};

// ── Read single client ───────────────────────────────────────────────────────
exports.read = async (req, res) => {
  const client = await Client.findById(req.params.id).populate('createdBy', 'name email');
  if (!client || client.removed) return res.status(404).json({ success: false, message: 'Client not found.' });

  // Fetch invoices for this client
  const invoices = await Invoice.find({ clientId: client._id, removed: false })
    .sort({ createdAt: -1 }).limit(10);

  res.json({ success: true, client, invoices });
};

// ── Update client ────────────────────────────────────────────────────────────
exports.update = async (req, res) => {
  const { name, email, phone, company, address, country, city, notes, source, status, tags } = req.body;
  const client = await Client.findByIdAndUpdate(
    req.params.id,
    { name, email, phone, company, address, country, city, notes, source, status, tags },
    { new: true, runValidators: true }
  );
  if (!client) return res.status(404).json({ success: false, message: 'Client not found.' });
  res.json({ success: true, client });
};

// ── Soft-delete client ───────────────────────────────────────────────────────
exports.remove = async (req, res) => {
  await Client.findByIdAndUpdate(req.params.id, { removed: true });
  res.json({ success: true, message: 'Client removed.' });
};

// ── Summary stats ────────────────────────────────────────────────────────────
exports.summary = async (req, res) => {
  const base = req.user.role === 'admin' ? {} : { createdBy: req.user._id };
  const [total, active, leads, inactive] = await Promise.all([
    Client.countDocuments({ ...base, removed: false }),
    Client.countDocuments({ ...base, removed: false, status: 'active' }),
    Client.countDocuments({ ...base, removed: false, status: 'lead' }),
    Client.countDocuments({ ...base, removed: false, status: 'inactive' }),
  ]);

  // Sources breakdown
  const sources = await Client.aggregate([
    { $match: { ...base, removed: false } },
    { $group: { _id: '$source', count: { $sum: 1 } } },
  ]);

  // Recent clients
  const recent = await Client.find({ ...base, removed: false })
    .sort({ createdAt: -1 }).limit(5).select('name email company source createdAt');

  res.json({ success: true, summary: { total, active, leads, inactive, sources, recent } });
};
