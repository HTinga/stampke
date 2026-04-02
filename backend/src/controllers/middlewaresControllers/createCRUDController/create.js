const supabase = require('@/config/supabase');
const logAudit = require('@/utils/auditLogger');

const create = async (table, req, res) => {
  req.body.removed = false;
  // If the request includes a user, ensure it matches the Supabase UUID format if necessary
  // For now, we assume the req.body is already formatted correctly for the table columns
  const { data, error } = await supabase
    .from(table)
    .insert([{ ...req.body }])
    .select()
    .single();

  if (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: 'Creation failed: ' + error.message,
    });
  }

  if (!error) {
    await logAudit(req, `Created ${table}`, { id: data.id, name: data.name || data.title || '' });
  }

  return res.status(200).json({
    success: true,
    result: data,
    message: 'Successfully created record',
  });
};

module.exports = create;

