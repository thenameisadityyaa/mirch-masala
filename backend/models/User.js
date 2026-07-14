const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone:    { type: String, default: '' },
    addresses: [
      {
        label:   { type: String, default: 'Home' },
        street:  { type: String, default: '' },
        city:    { type: String, default: '' },
        pincode: { type: String, default: '' },
      }
    ],
    isAdmin:       { type: Boolean, default: false },
    loyaltyPoints: { type: Number,  default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
