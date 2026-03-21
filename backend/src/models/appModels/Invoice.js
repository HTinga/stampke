const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  removed:   { type: Boolean, default: false },

  createdBy: { type: mongoose.Schema.ObjectId, ref: 'User', required: true, autopopulate: { select: 'name email company' } },
  client:    { type: mongoose.Schema.ObjectId, ref: 'Client', autopopulate: true },

  // Client snapshot (in case client is deleted — idurar pattern)
  clientName:    { type: String, required: true },
  clientEmail:   { type: String },
  clientPhone:   { type: String },
  clientAddress: { type: String },
  businessName:  { type: String },
  businessEmail: { type: String },

  invoiceNumber: { type: String, required: true },
  number:        { type: Number }, // auto-increment sequence (idurar pattern)
  year:          { type: Number, default: () => new Date().getFullYear() },

  items: [{
    itemName:    { type: String, required: true },
    description: { type: String },
    quantity:    { type: Number, default: 1, required: true },
    price:       { type: Number, required: true },
    total:       { type: Number, required: true },
  }],

  taxRate:    { type: Number, default: 16 },
  subTotal:   { type: Number, default: 0 },
  taxTotal:   { type: Number, default: 0 },
  total:      { type: Number, default: 0 },
  discount:   { type: Number, default: 0 },
  credit:     { type: Number, default: 0 },
  currency:   { type: String, default: 'KES', uppercase: true, required: true },

  date:        { type: Date, required: true },
  expiredDate: { type: Date, required: true },   // idurar calls it expiredDate

  notes: { type: String },

  status: {
    type: String,
    enum: ['draft', 'pending', 'sent', 'paid', 'overdue', 'cancelled', 'refunded'],
    default: 'draft',
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'partially'],
    default: 'unpaid',
  },
  isOverdue: { type: Boolean, default: false },

  // Tomo additions — reminder tracking
  paidAt:          { type: Date },
  reminderCount:   { type: Number, default: 0 },
  lastReminderAt:  { type: Date },

  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
});

invoiceSchema.plugin(require('mongoose-autopopulate'));
invoiceSchema.pre('save', function (next) {
  this.updated = Date.now();
  // Auto-calculate totals (idurar pattern)
  let subTotal = 0;
  this.items.forEach((item) => {
    item.total = item.quantity * item.price;
    subTotal += item.total;
  });
  this.subTotal = subTotal;
  this.taxTotal = subTotal * (this.taxRate / 100);
  this.total = this.subTotal + this.taxTotal - this.discount;
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
