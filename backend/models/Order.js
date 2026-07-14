const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  id:       { type: Number },
  name:     { type: String, required: true },
  price:    { type: String, required: true },
  category: { type: String },
  image:    { type: String },
  qty:      { type: Number, default: 1 },
});

const orderSchema = new mongoose.Schema(
  {
    orderId:  { type: String, unique: true },
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items:    [orderItemSchema],
    total:    { type: Number, required: true },
    address:  {
      street:  { type: String, default: '' },
      city:    { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['Accepted', 'Preparing', 'Out for Delivery', 'Delivered'],
      default: 'Accepted',
    },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

// Auto-generate a short readable order ID before saving
orderSchema.pre('save', async function (next) {
  if (!this.orderId) {
    const rand = Math.floor(1000 + Math.random() * 9000);
    this.orderId = `ORD-${rand}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
