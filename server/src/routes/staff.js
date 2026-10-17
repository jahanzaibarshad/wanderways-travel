import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import Booking from '../models/Booking.js';
import Tour from '../models/Tour.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate, requireRole('staff'));
const filters = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled']).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
});
router.get('/bookings', async (request, response) => {
  const parsed = filters.safeParse(request.query);
  if (!parsed.success) return response.status(400).json({ message: 'Invalid booking filters' });
  const { status, search, page } = parsed.data;
  const query = {};
  if (status) query.status = status;
  if (search) {
    const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const tours = await Tour.find({ $or: [{ title: pattern }, { destination: pattern }] })
      .select('_id')
      .lean();
    query.$or = [
      { reference: pattern },
      { contactName: pattern },
      { contactEmail: pattern },
      { tour: { $in: tours.map((tour) => tour._id) } },
    ];
  }
  const limit = 20;
  const [bookings, total, counts] = await Promise.all([
    Booking.find(query)
      .populate('tour', 'title destination')
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Booking.countDocuments(query),
    Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);
  const summary = { total: 0, pending: 0, confirmed: 0, cancelled: 0 };
  for (const count of counts) {
    summary[count._id] = count.count;
    summary.total += count.count;
  }
  response.json({
    bookings,
    pagination: { page, pages: Math.max(1, Math.ceil(total / limit)), total },
    summary,
  });
});
router.patch(
  '/bookings/:id/status',
  validate(z.object({ status: z.enum(['confirmed', 'cancelled']) })),
  async (request, response) => {
    if (!mongoose.isValidObjectId(request.params.id))
      return response.status(400).json({ message: 'Invalid booking ID' });
    let result;
    await mongoose.connection.transaction(async (session) => {
      const booking = await Booking.findById(request.params.id).session(session);
      if (!booking) {
        const error = new Error('Booking not found');
        error.status = 404;
        throw error;
      }
      const status = request.body.status;
      if (booking.status === status) {
        result = booking;
        return;
      }
      if (booking.status === 'cancelled') {
        const error = new Error('A cancelled booking cannot be reopened');
        error.status = 409;
        throw error;
      }
      if (status === 'cancelled') {
        const updated = await Tour.updateOne(
          {
            _id: booking.tour,
            slots: { $elemMatch: { _id: booking.slot, bookedSeats: { $gte: booking.guests } } },
          },
          { $inc: { 'slots.$.bookedSeats': -booking.guests } },
          { session },
        );
        if (updated.modifiedCount !== 1) {
          const error = new Error('Unable to release departure seats');
          error.status = 409;
          throw error;
        }
      }
      booking.status = status;
      result = await booking.save({ session });
    });
    response.json(result);
  },
);
export default router;
