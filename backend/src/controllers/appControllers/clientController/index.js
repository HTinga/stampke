const mongoose            = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

const Client  = mongoose.model('Client');
const Invoice = mongoose.model('Invoice');

const methods = createCRUDController('Client');

// Override create to attach createdBy
methods.create = async (req, res) => {
  const data = { ...req.body, createdBy: req.user._id, removed: false };
  if (!data.name)
    return res.status(400).json({ success: false, result: null, message: 'Client name is required.' });
  const result = await new Client(data).save();
  return res.status(200).json({ success: true, result, message: 'Client created successfully.' });
};

// Override list to scope by user (admins see all)
methods.list = async (req, res) => {
  const page   = parseInt(req.query.page)  || 1;
  const limit  = parseInt(req.query.items) || 10;
  const skip   = (page - 1) * limit;
  const { q, fields, filter: f, equal, sortBy = 'created', sortValue = -1 } = req.query;

  const base = req.user.role === 'owner' || req.user.role === 'admin'
    ? { removed: false }
    : { removed: false, createdBy: req.user._id };

  if (f && equal) base[f] = equal;

  if (q && fields) {
    base.$or = fields.split(',').map((field) => ({ [field]: { $regex: q, $options: 'i' } }));
  }

  const [result, count] = await Promise.all([
    Client.find(base).skip(skip).limit(limit).sort({ [sortBy]: parseInt(sortValue) }),
    Client.countDocuments(base),
  ]);

  const pages = Math.ceil(count / limit);
  return res.status(count > 0 ? 200 : 203).json({
    success: true, result,
    pagination: { page, pages, count },
    message: count > 0 ? 'Clients found.' : 'No clients yet.',
  });
};

// Rich summary — counts + sources breakdown + recent
methods.summary = async (req, res) => {
  const base = req.user.role === 'owner' || req.user.role === 'admin'
    ? { removed: false }
    : { removed: false, createdBy: req.user._id };

  const [total, active, leads, inactive, sources] = await Promise.all([
    Client.countDocuments({ ...base }),
    Client.countDocuments({ ...base, status: 'active' }),
    Client.countDocuments({ ...base, status: 'lead' }),
    Client.countDocuments({ ...base, status: 'inactive' }),
    Client.aggregate([
      { $match: base },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $project: { _id: 0, source: '$_id', count: 1 } },
    ]),
  ]);

  const recent = await Client.find(base).sort({ created: -1 }).limit(5)
    .select('name email company source status created');

  return res.status(200).json({
    success: true,
    result: { total, active, leads, inactive, sources, recent },
    message: 'Client summary.',
  });
};

module.exports = methods;
