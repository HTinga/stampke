const supabase = require('@/config/supabase');

const summary = async (table, req, res) => {
  const { count: countAllDocs, error: errorAll } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('removed', false);

  if (errorAll) {
    return res.status(400).json({ success: false, result: null, message: errorAll.message });
  }

  let countFilter = countAllDocs;
  if (req.query.filter && req.query.equal) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('removed', false)
      .eq(req.query.filter, req.query.equal);
    
    if (error) {
      return res.status(400).json({ success: false, result: null, message: error.message });
    }
    countFilter = count;
  }

  return res.status(200).json({
    success: true,
    result: { countFilter, countAllDocs },
    message: 'Summary complete',
  });
};

module.exports = summary;

