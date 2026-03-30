const mongoose = require('mongoose');
const Template = require('../../models/appModels/Template');

exports.createTemplate = async (req, res) => {
  try {
    const { name, config, svgPreview, category, templateType } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: User not found' });
    }

    const template = new Template({
      name: name || 'Untitled Stamp',
      config,
      svgPreview,
      category: category || 'Custom',
      templateType: templateType || 'sample',
      userId: req.user._id,
    });

    await template.save();
    
    return res.status(201).json({ 
      success: true, 
      result: template,
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
    
    const templates = await Template.find({ 
      userId: req.user._id,
      removed: false 
    }).sort({ createdAt: -1 });
    
    return res.status(200).json({ success: true, result: templates });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const template = await Template.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { removed: true },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    return res.status(200).json({ success: true, message: 'Template deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
