import { Router } from 'express';
import mongoose from 'mongoose';
import Tour from '../models/Tour.js';

const router = Router();
router.get('/', async (_request, response) => {
  response.json(await Tour.find({ active: true }).sort({ destination: 1 }).lean());
});
router.get('/:id', async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.id))
    return response.status(400).json({ message: 'Invalid tour ID' });
  const tour = await Tour.findOne({ _id: request.params.id, active: true }).lean();
  if (!tour) return response.status(404).json({ message: 'Tour not found' });
  response.json(tour);
});
export default router;
