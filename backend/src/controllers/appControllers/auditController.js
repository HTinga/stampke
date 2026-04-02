const supabase = require('@/config/supabase');

exports.createLog = async (req, res) => {
  try {
    const { action, details } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('audit_logs')
      .insert([{
        user_id: req.user.id,
        action,
        details,
        ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      }])
      .select()
      .single();

    if (error) throw error;
    
    return res.status(201).json({ 
      success: true, 
      result: data,
      message: 'Audit log created' 
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', req.user.id)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) throw error;
    
    return res.status(200).json({ success: true, result: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
