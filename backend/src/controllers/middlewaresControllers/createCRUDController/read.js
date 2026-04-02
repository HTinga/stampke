const supabase = require('@/config/supabase');

const read = async (table, req, res) => {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', req.params.id)
    .eq('removed', false)
    .single();

  if (error || !data) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'Record not found',
    });
  }

  return res.status(200).json({
    success: true,
    result: data,
    message: 'Successfully found record',
  });
};

module.exports = read;

