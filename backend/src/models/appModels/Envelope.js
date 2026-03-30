const mongoose = require('mongoose');

const SignFieldSchema = new mongoose.Schema({
  id: String,
  type: { type: String, enum: ['signature', 'stamp', 'date', 'text', 'initials'] },
  x: Number,
  y: Number,
  width: Number,
  height: Number,
  page: Number,
  signerId: String,
  value: String,
  isCompleted: { type: Boolean, default: false }
});

const SignerInfoSchema = new mongoose.Schema({
  id: String,
  name: String,
  email: String,
  role: { type: String, enum: ['signer', 'approver', 'viewer'], default: 'signer' },
  order: Number,
  status: { type: String, enum: ['pending', 'viewed', 'signed', 'declined'], default: 'pending' },
  lastActivity: Date,
  ip: String
});

const BulkDocumentSchema = new mongoose.Schema({
  id: String,
  name: String,
  type: String,
  size: Number,
  pages: Number,
  previewUrl: String,
  pagePreviews: [String]
});

const AuditEntrySchema = new mongoose.Schema({
  id: String,
  timestamp: { type: Date, default: Date.now },
  action: String,
  user: String,
  ip: String,
  details: String
});

const EnvelopeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  status: { type: String, enum: ['draft', 'sent', 'completed', 'voided', 'archived'], default: 'draft' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  documents: [BulkDocumentSchema],
  signers: [SignerInfoSchema],
  fields: [SignFieldSchema],
  auditLog: [AuditEntrySchema],
  requiresPayment: { type: Boolean, default: false },
  paymentAmount: Number,
  paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
  removed: { type: Boolean, default: false }
});

module.exports = mongoose.model('Envelope', EnvelopeSchema);
