const supabase = require('@/config/supabase');
const logAudit = require('@/utils/auditLogger');

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

  if (!error && data) {
    await logAudit(req, `Deleted ${table}`, { id: data.id, name: data.name || data.title || '' });
  }

  return res.status(200).json({
    success: true,
    result: data,
    message: 'Successfully deleted record',
  });
};

module.exports = remove;

