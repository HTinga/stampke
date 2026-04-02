const supabase = require('@/config/supabase');

const paginatedList = async (table, req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.items) || 10;
  const skip  = (page - 1) * limit;

  const { sortBy = 'created_at', sortValue = -1, filter, equal, q, fields } = req.query;

  let query = supabase
    .from(table)
    .select('*', { count: 'exact' })
    .eq('removed', false);

  // Apply simple filter if present
  if (filter && equal !== undefined) {
    query = query.eq(filter, equal);
  }

  // Apply search query if present
  if (q && fields) {
    const fieldsArray = fields.split(',');
    const orCondition = fieldsArray.map(f => `${f}.ilike.%${q}%`).join(',');
    query = query.or(orCondition);
  }

  // Apply sorting
  query = query.order(sortBy, { ascending: parseInt(sortValue) === 1 });

  // Apply pagination
  const { data, count, error } = await query.range(skip, skip + limit - 1);

  if (error) {
    return res.status(400).json({
      success: false,
      result: [],
      message: 'Found error: ' + error.message,
    });
  }

  const pages = Math.ceil((count || 0) / limit);
  const pagination = { page, pages, count: count || 0 };

  if ((count || 0) > 0) {
    return res.status(200).json({
      success: true,
      result: data,
      pagination,
      message: 'Successfully found all records',
    });
  }

  return res.status(203).json({
    success: true,
    result: [],
    pagination,
    message: 'Collection is empty',
  });
};

module.exports = paginatedList;

