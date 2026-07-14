const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    itemId:   { type: Number, required: true },   // matches menuItems.js id
    itemName: { type: String, required: true },
    rating:   { type: Number, min: 1, max: 5, required: true },
    comment:  { type: String, default: '', maxlength: 500, trim: true },
  },
  { timestamps: true }
);

// One review per user per item
reviewSchema.index({ userId: 1, itemId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
