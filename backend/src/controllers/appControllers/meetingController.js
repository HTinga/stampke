const supabase = require('@/config/supabase');

exports.createMeeting = async (req, res) => {
  try {
    const { title, duration, transcript, summary, keyPoints, actionItems } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('meeting_summaries')
      .insert([{
        title: title || 'Untitled Meeting',
        duration,
        transcript,
        summary,
        key_points: keyPoints || [],
        action_items: actionItems || [],
        user_id: req.user.id,
        removed: false
      }])
      .select()
      .single();

    if (error) throw error;
    
    return res.status(201).json({ 
      success: true, 
      result: data,
      message: 'Meeting summary saved successfully' 
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMeetings = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('meeting_summaries')
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

exports.getMeeting = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('meeting_summaries')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .eq('removed', false)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    return res.status(200).json({ success: true, result: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateMeeting = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { title, notes } = req.body;

    const { data, error } = await supabase
      .from('meeting_summaries')
      .update({ title, notes, updated_at: new Date() })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    return res.status(200).json({ success: true, result: data, message: 'Meeting updated' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteMeeting = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('meeting_summaries')
      .update({ removed: true, updated_at: new Date() })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    return res.status(200).json({ success: true, message: 'Meeting deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
