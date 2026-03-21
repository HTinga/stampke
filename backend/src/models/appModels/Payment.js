const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  removed:   { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.ObjectId, ref: 'User', required: true, autopopulate: { select: 'name email' } },
  client:    { type: mongoose.Schema.ObjectId, ref: 'Client', autopopulate: true, required: true },
  invoice:   { type: mongoose.Schema.ObjectId, ref: 'Invoice', required: true, autopopulate: true },
  number:    { type: Number, required: true },
  date:      { type: Date, default: Date.now, required: true },
  amount:    { type: Number, required: true },
  currency:  { type: String, default: 'KES', uppercase: true, required: true },
  ref:       { type: String },           // M-Pesa ref, bank ref, etc.
  method:    { type: String, enum: ['mpesa', 'bank', 'cash', 'card', 'cheque', 'other'], default: 'mpesa' },
  description: { type: String },
  created:   { type: Date, default: Date.now },
  updated:   { type: Date, default: Date.now },
});

paymentSchema.plugin(require('mongoose-autopopulate'));
module.exports = mongoose.model('Payment', paymentSchema);
