const supabase = require('@/config/supabase');

exports.createTemplate = async (req, res) => {
  try {
    const { name, config, svgPreview, category, templateType } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: User not found' });
    }

    const { data, error } = await supabase
      .from('templates')
      .insert([{
        name: name || 'Untitled Stamp',
        config,
        svg_preview: svgPreview,
        category: category || 'Custom',
        template_type: templateType || 'sample',
        user_id: req.user.id,
        removed: false
      }])
      .select()
      .single();

    if (error) throw error;
    
    return res.status(201).json({ 
      success: true, 
      result: data,
      message: 'Template saved successfully' 
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTemplates = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('removed', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return res.status(200).json({ success: true, result: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('templates')
      .update({ removed: true })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    return res.status(200).json({ success: true, message: 'Template deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
