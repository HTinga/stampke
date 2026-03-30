const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  config: {
    type: Object,
    required: true,
  },
  category: {
    type: String,
    default: 'Custom',
  },
  templateType: {
    type: String,
    enum: ['completed', 'sample'],
    default: 'sample',
  },
  svgPreview: {
    type: String, // Base64 or serialized SVG
  },
  removed: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Template', templateSchema);
