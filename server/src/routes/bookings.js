import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import Booking from '../models/Booking.js';
import Tour from '../models/Tour.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID');
const bookingInput = z.object({
  tourId: objectId,
  slotId: objectId,
  guests: z.number().int().min(1).max(12),
  contactName: z.string().trim().min(2).max(80),
  contactEmail: z.string().trim().toLowerCase().email().max(254),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(30)
    .regex(/^[+\d\s()-]+$/, 'Invalid phone number'),
});
router.use(authenticate);
router.get('/mine', async (request, response) => {
  response.json(
    await Booking.find({ user: request.user._id })
      .populate('tour', 'title destination')
      .sort({ createdAt: -1 })
      .lean(),
  );
});
router.get('/:id', async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.id))
    return response.status(400).json({ message: 'Invalid booking ID' });
  const booking = await Booking.findOne({ _id: request.params.id, user: request.user._id })
    .populate('tour', 'title destination duration')
    .lean();
  if (!booking) return response.status(404).json({ message: 'Booking not found' });
  response.json(booking);
});
router.post('/', requireRole('customer'), validate(bookingInput), async (request, response) => {
  const { tourId, slotId, guests, contactName, contactEmail, phone } = request.body;
  let booking;
  await mongoose.connection.transaction(async (session) => {
    const tour = await Tour.findOneAndUpdate(
      {
        _id: tourId,
        active: true,
        slots: { $elemMatch: { _id: slotId, date: { $gt: new Date() } } },
        $expr: {
          $anyElementTrue: {
            $map: {
              input: '$slots',
              as: 'slot',
              in: {
                $and: [
                  { $eq: ['$$slot._id', new mongoose.Types.ObjectId(slotId)] },
                  { $lte: [{ $add: ['$$slot.bookedSeats', guests] }, '$$slot.capacity'] },
                ],
              },
            },
          },
        },
      },
      { $inc: { 'slots.$.bookedSeats': guests } },
      { new: true, session },
    );
    if (!tour) {
      const error = new Error('This departure is unavailable or has insufficient seats');
      error.status = 409;
      throw error;
    }
    const slot = tour.slots.id(slotId);
    [booking] = await Booking.create(
      [
        {
          user: request.user._id,
          tour: tour._id,
          slot: slot._id,
          date: slot.date,
          guests,
          contactName,
          contactEmail,
          phone,
          totalPrice: tour.price * guests,
        },
      ],
      { session },
    );
  });
  response.status(201).json(booking);
});
export default router;
