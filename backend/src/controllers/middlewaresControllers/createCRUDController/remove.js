const supabase = require('@/config/supabase');

const remove = async (table, req, res) => {
  const { data, error } = await supabase
    .from(table)
    .update({ removed: true })
    .eq('id', req.params.id)
    .eq('removed', false)
    .select()
    .single();

  if (error || !data) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'Record not found or delete failed',
    });
  }

  return res.status(200).json({
    success: true,
    result: data,
    message: 'Successfully deleted record',
  });
};

module.exports = remove;

