const supabase = require('@/config/supabase');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

// Helper to check if user is admin
const isAdmin = (user) => user.role === 'owner' || user.role === 'admin' || user.role === 'superadmin';

const methods = createCRUDController('Client');

// Override create to attach createdBy
methods.create = async (req, res) => {
  const { name, email, phone, company, address, country, city, notes, source, status } = req.body;
  
  if (!name)
    return res.status(400).json({ success: false, result: null, message: 'Client name is required.' });

  const { data, error } = await supabase
    .from('clients')
    .insert([{
      name, email, phone, company, address, country, city, notes, source, status,
      created_by: req.user.id,
      removed: false
    }])
    .select()
    .single();

  if (error)
    return res.status(400).json({ success: false, result: null, message: error.message });

  return res.status(200).json({ success: true, result: data, message: 'Client created successfully.' });
};

// Override list to scope by user
methods.list = async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.items) || 10;
  const skip  = (page - 1) * limit;
  const { q, fields, filter: f, equal, sortBy = 'created_at', sortValue = -1 } = req.query;

  let query = supabase
    .from('clients')
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
    message: (count || 0) > 0 ? 'Clients found.' : 'No clients yet.',
  });
};

// Rich summary — counts + recent
methods.summary = async (req, res) => {
  const baseQuery = supabase.from('clients').select('id, status, source', { count: 'exact', head: false }).eq('removed', false);
  
  const finalQuery = isAdmin(req.user) ? baseQuery : baseQuery.eq('created_by', req.user.id);

  const { data: allClients, error } = await finalQuery;

  if (error)
    return res.status(400).json({ success: false, result: null, message: error.message });

  const total    = allClients.length;
  const active   = allClients.filter(c => c.status === 'active').length;
  const leads    = allClients.filter(c => c.status === 'lead').length;
  const inactive = allClients.filter(c => c.status === 'inactive').length;

  // Group by source
  const sourceObj = {};
  allClients.forEach(c => {
    const s = c.source || 'direct';
    sourceObj[s] = (sourceObj[s] || 0) + 1;
  });
  const sources = Object.keys(sourceObj).map(s => ({ source: s, count: sourceObj[s] }));

  // Get recent
  let recentQuery = supabase
    .from('clients')
    .select('name, email, company, source, status, created_at')
    .eq('removed', false)
    .order('created_at', { ascending: false })
    .limit(5);

  if (!isAdmin(req.user)) recentQuery = recentQuery.eq('created_by', req.user.id);

  const { data: recent } = await recentQuery;

  return res.status(200).json({
    success: true,
    result: { total, active, leads, inactive, sources, recent },
    message: 'Client summary.',
  });
};

module.exports = methods;

