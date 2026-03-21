const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  qty:         { type: Number, required: true, default: 1 },
  unitPrice:   { type: Number, required: true },
  total:       { type: Number },
}, { _id: false });

lineItemSchema.pre('save', function () { this.total = this.qty * this.unitPrice; });

const invoiceSchema = new mongoose.Schema({
  invoiceNumber:  { type: String, required: true },
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clientId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },

  // Client snapshot (in case client is deleted)
  clientName:     { type: String, required: true },
  clientEmail:    { type: String },
  clientPhone:    { type: String },
  clientAddress:  { type: String },
  businessName:   { type: String },
  businessEmail:  { type: String },

  lineItems:  [lineItemSchema],
  subtotal:   { type: Number, default: 0 },
  taxRate:    { type: Number, default: 16 },
  taxAmount:  { type: Number, default: 0 },
  total:      { type: Number, default: 0 },
  currency:   { type: String, default: 'KES' },

  issuedDate: { type: Date, required: true },
  dueDate:    { type: Date, required: true },
  note:       { type: String },

  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft',
  },
  paidAt:          { type: Date },
  reminderCount:   { type: Number, default: 0 },
  lastReminderAt:  { type: Date },

  removed:   { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Recalculate totals before save
invoiceSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  this.subtotal = this.lineItems.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  this.taxAmount = this.subtotal * (this.taxRate / 100);
  this.total = this.subtotal + this.taxAmount;
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
