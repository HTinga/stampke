const supabase = require('@/config/supabase');

const search = async (table, req, res) => {
  const { q = '', fields = '', page = 1, items = 10 } = req.query;
  const limit = parseInt(items);
  const skip  = (parseInt(page) - 1) * limit;

  const fieldsArray = fields ? fields.split(',') : [];
  let query = supabase
    .from(table)
    .select('*', { count: 'exact' })
    .eq('removed', false);

  if (fieldsArray.length > 0 && q) {
    const orCondition = fieldsArray.map(f => `${f}.ilike.%${q}%`).join(',');
    query = query.or(orCondition);
  }

  const { data, count, error } = await query.range(skip, skip + limit - 1);

  if (error) {
    return res.status(400).json({
      success: false,
      result: [],
      message: 'Search failed: ' + error.message,
    });
  }

  return res.status(200).json({
    success: true,
    result: data,
    pagination: {
      page: parseInt(page),
      pages: Math.ceil((count || 0) / limit),
      count: count || 0,
    },
    message: 'Search results',
  });
};

module.exports = search;

