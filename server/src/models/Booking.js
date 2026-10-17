import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';

const bookingSchema = new mongoose.Schema(
  {
    reference: { type: String, unique: true, default: () => `WW-${randomUUID().toUpperCase()}` },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tour: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true },
    slot: { type: mongoose.Schema.Types.ObjectId, required: true },
    date: { type: Date, required: true },
    guests: { type: Number, required: true, min: 1, max: 12, validate: Number.isInteger },
    contactName: { type: String, required: true, trim: true, maxlength: 80 },
    contactEmail: {
      type: String,
      required: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    phone: { type: String, required: true, maxlength: 30 },
    totalPrice: { type: Number, required: true, min: 0, validate: Number.isInteger },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  },
  { timestamps: true },
);

export default mongoose.model('Booking', bookingSchema);
