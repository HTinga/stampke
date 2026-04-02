const supabase = require('@/config/supabase');

const listAll = async (table, req, res) => {
  const { sortBy = 'created_at', sortValue = -1 } = req.query;
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('removed', false)
    .order(sortBy, { ascending: parseInt(sortValue) === 1 });

  if (error) {
    return res.status(400).json({
      success: false,
      result: [],
      message: 'Found error: ' + error.message,
    });
  }

  return res.status(200).json({
    success: true,
    result: data,
    message: 'Successfully found all records',
  });
};

module.exports = listAll;

