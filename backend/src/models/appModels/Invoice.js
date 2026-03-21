'use strict';
const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  removed:       { type: Boolean, default: false },
  createdBy:     { type: mongoose.Schema.ObjectId, ref: 'User', required: true, autopopulate: { select: 'name email company' } },
  client:        { type: mongoose.Schema.ObjectId, ref: 'Client', autopopulate: true },
  clientName:    { type: String, required: true },
  clientEmail:   { type: String },
  clientPhone:   { type: String },
  clientAddress: { type: String },
  businessName:  { type: String },
  businessEmail: { type: String },
  invoiceNumber: { type: String, required: true },
  number:        { type: Number },
  year:          { type: Number, default: () => new Date().getFullYear() },
  items: [{
    itemName:    { type: String, required: true },
    description: { type: String },
    quantity:    { type: Number, default: 1 },
    price:       { type: Number, required: true },
    total:       { type: Number, required: true },
  }],
  taxRate:    { type: Number, default: 16 },
  subTotal:   { type: Number, default: 0 },
  taxTotal:   { type: Number, default: 0 },
  total:      { type: Number, default: 0 },
  discount:   { type: Number, default: 0 },
  credit:     { type: Number, default: 0 },
  currency:   { type: String, default: 'KES', uppercase: true },
  date:        { type: Date, required: true },
  expiredDate: { type: Date, required: true },
  notes:       { type: String },
  status:      { type: String, enum: ['draft','pending','sent','paid','overdue','cancelled','refunded'], default: 'draft' },
  paymentStatus: { type: String, enum: ['unpaid','paid','partially'], default: 'unpaid' },
  isOverdue:   { type: Boolean, default: false },
  paidAt:          { type: Date },
  reminderCount:   { type: Number, default: 0 },
  lastReminderAt:  { type: Date },
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
});

// ── Indexes (issue #6) ────────────────────────────────────────────────────────
invoiceSchema.index({ createdBy: 1, removed: 1 });
invoiceSchema.index({ status: 1, removed: 1 });
invoiceSchema.index({ expiredDate: 1, status: 1 });
invoiceSchema.index({ invoiceNumber: 1 });

invoiceSchema.plugin(require('mongoose-autopopulate'));
invoiceSchema.pre('save', function (next) {
  this.updated = Date.now();
  let sub = 0;
  this.items.forEach(i => { i.total = i.quantity * i.price; sub += i.total; });
  this.subTotal = sub;
  this.taxTotal = sub * (this.taxRate / 100);
  this.total    = this.subTotal + this.taxTotal - (this.discount || 0);
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
