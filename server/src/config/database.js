import mongoose from 'mongoose';

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  try {
    if (!uri)
      throw new Error('MONGODB_URI is required. Configure MongoDB Atlas or a MongoDB replica set.');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    const { default: User } = await import('../models/User.js');
    const { default: Tour } = await import('../models/Tour.js');
    const { default: Booking } = await import('../models/Booking.js');
    await Promise.all([User.init(), Tour.init(), Booking.init()]);
    return async () => {
      await mongoose.disconnect();
    };
  } catch (error) {
    await mongoose.disconnect();
    throw error;
  }
}
