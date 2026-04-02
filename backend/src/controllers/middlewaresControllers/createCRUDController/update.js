const supabase = require('@/config/supabase');

const update = async (table, req, res) => {
  const { data, error } = await supabase
    .from(table)
    .update(req.body)
    .eq('id', req.params.id)
    .eq('removed', false)
    .select()
    .single();

  if (error || !data) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'Record not found or update failed: ' + (error ? error.message : ''),
    });
  }

  return res.status(200).json({
    success: true,
    result: data,
    message: 'Successfully updated record',
  });
};

module.exports = update;

