const supabase = require('@/config/supabase');

const filter = async (table, req, res) => {
  const { filter: filterField, equal, page = 1, items = 10 } = req.query;
  const limit = parseInt(items);
  const skip  = (parseInt(page) - 1) * limit;

  let query = supabase
    .from(table)
    .select('*', { count: 'exact' })
    .eq('removed', false);

  if (filterField && equal !== undefined) {
    query = query.eq(filterField, equal);
  }

  const { data, count, error } = await query.range(skip, skip + limit - 1);

  if (error) {
    return res.status(400).json({
      success: false,
      result: [],
      message: 'Filter failed: ' + error.message,
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
    message: 'Filter results',
  });
};

module.exports = filter;

