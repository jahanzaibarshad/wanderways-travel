import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  capacity: { type: Number, required: true, min: 1, validate: Number.isInteger },
  bookedSeats: { type: Number, default: 0, min: 0, validate: Number.isInteger },
});
slotSchema.pre('validate', function () {
  if (this.bookedSeats > this.capacity)
    this.invalidate('bookedSeats', 'Booked seats exceed capacity');
});
const tourSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true, maxlength: 3000 },
    destination: { type: String, required: true },
    price: { type: Number, required: true, min: 0, validate: Number.isInteger },
    currency: { type: String, default: 'PKR', enum: ['PKR'] },
    duration: { type: Number, required: true, min: 1, validate: Number.isInteger },
    slots: {
      type: [slotSchema],
      validate: [(slots) => slots.length > 0, 'At least one departure is required'],
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model('Tour', tourSchema);
