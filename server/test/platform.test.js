import { beforeAll, afterAll, describe, test, expect, jest } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import app from '../src/app.js';
import Tour from '../src/models/Tour.js';
import Booking from '../src/models/Booking.js';
import User from '../src/models/User.js';
import { jwtSecret } from '../src/config/auth.js';
import { seedTours } from '../src/data/seed.js';

let database;
let testPath;
let tour;
let customer;
let staff;
let customerId;
const details = {
  name: 'Test Traveller',
  email: 'traveller@example.com',
  password: 'Journey-Password42',
};
const bookingBody = (overrides = {}) => ({
  tourId: String(tour._id),
  slotId: String(tour.slots[0]._id),
  guests: 2,
  contactName: details.name,
  contactEmail: details.email,
  phone: '+92 300 1234567',
  ...overrides,
});

beforeAll(async () => {
  testPath = await mkdtemp(join(process.env.TEST_DB_ROOT || tmpdir(), 'wanderways-test-'));
  database = await MongoMemoryReplSet.create({
    instanceOpts: [{ dbPath: testPath }],
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });
  await mongoose.connect(database.getUri());
  await Promise.all([User.init(), Tour.init(), Booking.init()]);
  await seedTours();
  tour = await Tour.findOne({ slug: 'hunza-valley' });
  customer = request.agent(app);
  const registration = await customer.post('/api/auth/register').send(details);
  customerId = registration.body.user.id;
  await User.create({
    name: 'Staff User',
    email: 'staff@example.com',
    password: await bcrypt.hash('Staff-Password42', 12),
    role: 'staff',
  });
  staff = request.agent(app);
  await staff
    .post('/api/auth/login')
    .send({ email: 'staff@example.com', password: 'Staff-Password42' });
});
afterAll(async () => {
  await mongoose.disconnect();
  if (database) await database.stop();
  if (testPath) await rm(testPath, { recursive: true, force: true });
});

describe('Models and public tours', () => {
  test('health reports database connectivity', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.database).toBe('connected');
  });
  test('seed is idempotent and preserves existing departures', async () => {
    expect(await seedTours()).toBe(0);
    expect(await Tour.countDocuments()).toBe(5);
    expect(String((await Tour.findById(tour._id)).slots[0]._id)).toBe(String(tour.slots[0]._id));
  });
  test('list returns five tours as JSON array', async () => {
    const response = await request(app).get('/api/tours');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(5);
    expect(response.body[0]).toHaveProperty('price');
  });
  test('details and unknown IDs have meaningful responses', async () => {
    expect((await request(app).get(`/api/tours/${tour._id}`)).body.title).toBe(tour.title);
    expect((await request(app).get('/api/tours/bad-id')).status).toBe(400);
    expect((await request(app).get(`/api/tours/${new mongoose.Types.ObjectId()}`)).status).toBe(
      404,
    );
  });
  test('inactive tours are hidden', async () => {
    await Tour.updateOne({ _id: tour._id }, { active: false });
    expect((await request(app).get('/api/tours')).body).toHaveLength(4);
    expect((await request(app).get(`/api/tours/${tour._id}`)).status).toBe(404);
    await Tour.updateOne({ _id: tour._id }, { active: true });
  });
  test('tour schema rejects missing fields, invalid price and capacity', () => {
    const errors = new Tour({
      price: -10,
      slots: [{ date: new Date(), capacity: 0 }],
    }).validateSync().errors;
    expect(errors.title).toBeDefined();
    expect(errors.description).toBeDefined();
    expect(errors.price).toBeDefined();
    expect(errors['slots.0.capacity']).toBeDefined();
  });
  test('booking schema rejects missing fields and fractional guests', () => {
    const errors = new Booking({ guests: 1.5, totalPrice: -1 }).validateSync().errors;
    expect(errors.user).toBeDefined();
    expect(errors.tour).toBeDefined();
    expect(errors.guests).toBeDefined();
    expect(errors.totalPrice).toBeDefined();
  });
});

describe('Customer and staff authentication', () => {
  test('registration hashes passwords and never exposes them', async () => {
    const stored = await User.findById(customerId).select('+password');
    expect(stored.password).not.toBe(details.password);
    expect(await bcrypt.compare(details.password, stored.password)).toBe(true);
    const me = await customer.get('/api/auth/me');
    expect(me.body.user.password).toBeUndefined();
    expect(me.body.user.role).toBe('customer');
  });
  test('a public registration cannot grant staff access', async () => {
    const agent = request.agent(app);
    const response = await agent
      .post('/api/auth/register')
      .send({ ...details, email: 'not-staff@example.com', role: 'staff' });
    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe('customer');
    expect((await agent.get('/api/staff/session')).status).toBe(403);
  });
  test('duplicate and invalid registration are rejected', async () => {
    expect((await request(app).post('/api/auth/register').send(details)).status).toBe(409);
    expect(
      (
        await request(app)
          .post('/api/auth/register')
          .send({ name: 'X', email: 'wrong', password: 'short' })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .post('/api/auth/register')
          .send({ ...details, email: 'unicode@example.com', password: '🙂'.repeat(30) })
      ).status,
    ).toBe(400);
  });
  test('login issues a valid JWT in an HttpOnly cookie', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: details.email.toUpperCase(), password: details.password });
    expect(response.status).toBe(200);
    const cookie = response.headers['set-cookie'][0];
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    const token = cookie.split(';')[0].split('=')[1];
    const payload = jwt.verify(token, jwtSecret, {
      algorithms: ['HS256'],
      issuer: 'wanderways',
      audience: 'wanderways-client',
    });
    expect(payload.sub).toBe(customerId);
    expect(payload.exp).toBeGreaterThan(payload.iat);
    expect(response.body.user.password).toBeUndefined();
    expect(
      (await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)).status,
    ).toBe(200);
  });
  test('incorrect credentials return 401', async () => {
    expect(
      (
        await request(app)
          .post('/api/auth/login')
          .send({ email: details.email, password: 'incorrect-password' })
      ).status,
    ).toBe(401);
    expect(
      (
        await request(app)
          .post('/api/auth/login')
          .send({ email: 'unknown@example.com', password: details.password })
      ).status,
    ).toBe(401);
  });
  test('missing, invalid and expired JWTs return 401', async () => {
    expect((await request(app).post('/api/bookings').send(bookingBody())).status).toBe(401);
    expect(
      (await request(app).get('/api/auth/me').set('Authorization', 'Bearer nonsense')).status,
    ).toBe(401);
    const token = jwt.sign({}, jwtSecret, {
      subject: customerId,
      expiresIn: -10,
      issuer: 'wanderways',
      audience: 'wanderways-client',
    });
    expect(
      (await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)).status,
    ).toBe(401);
  });
  test('staff role is verified from the database', async () => {
    expect((await customer.get('/api/staff/session')).status).toBe(403);
    expect((await staff.get('/api/staff/session')).status).toBe(200);
    expect((await staff.post('/api/bookings').send(bookingBody())).status).toBe(403);
  });
  test('foreign origins cannot submit cookie-authenticated mutations', async () => {
    expect(
      (
        await customer
          .post('/api/bookings')
          .set('Origin', 'https://untrusted.example')
          .send(bookingBody())
      ).status,
    ).toBe(403);
  });
  test('logout clears the browser session', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send(details);
    expect((await agent.post('/api/auth/logout')).status).toBe(200);
    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });
});

describe('Protected reservations and capacity', () => {
  test('booking returns 201 and server calculates price and user', async () => {
    const response = await customer
      .post('/api/bookings')
      .send(bookingBody({ totalPrice: 1, user: new mongoose.Types.ObjectId() }));
    expect(response.status).toBe(201);
    expect(response.body._id).toBeDefined();
    expect(response.body.reference).toMatch(/^WW-/);
    expect(response.body.totalPrice).toBe(tour.price * 2);
    expect(response.body.user).toBe(customerId);
    expect((await Tour.findById(tour._id)).slots[0].bookedSeats).toBe(2);
  });
  test('booking validates guests and IDs', async () => {
    for (const body of [
      { guests: 0 },
      { guests: 1.5 },
      { guests: 13 },
      { slotId: 'bad' },
      { contactEmail: 'bad' },
    ]) {
      expect((await customer.post('/api/bookings').send(bookingBody(body))).status).toBe(400);
    }
  });
  test('a failed booking write rolls back the seat reservation', async () => {
    const seatsBefore = (await Tour.findById(tour._id)).slots[0].bookedSeats;
    const countBefore = await Booking.countDocuments();
    const failure = new Error('Simulated booking write failure');
    failure.status = 503;
    const write = jest.spyOn(Booking, 'create').mockRejectedValueOnce(failure);
    try {
      const response = await customer.post('/api/bookings').send(bookingBody());
      expect(response.status).toBe(503);
      expect((await Tour.findById(tour._id)).slots[0].bookedSeats).toBe(seatsBefore);
      expect(await Booking.countDocuments()).toBe(countBefore);
    } finally {
      write.mockRestore();
    }
  });
  test('concurrent reservations cannot oversell the last seats', async () => {
    const slot = tour.slots[1];
    const results = await Promise.all(
      [1, 2].map(() =>
        customer.post('/api/bookings').send(bookingBody({ slotId: String(slot._id), guests: 8 })),
      ),
    );
    expect(results.map((result) => result.status).sort()).toEqual([201, 409]);
    expect((await Tour.findById(tour._id)).slots[1].bookedSeats).toBe(8);
    expect(await Booking.countDocuments({ slot: slot._id })).toBe(1);
  });
  test('past dates and nonexistent departures are rejected without reserving seats', async () => {
    await Tour.updateOne({ _id: tour._id }, { $set: { 'slots.2.date': new Date('2000-01-01') } });
    expect(
      (
        await customer
          .post('/api/bookings')
          .send(bookingBody({ slotId: String(tour.slots[2]._id) }))
      ).status,
    ).toBe(409);
    expect(
      (
        await customer
          .post('/api/bookings')
          .send(bookingBody({ slotId: String(new mongoose.Types.ObjectId()) }))
      ).status,
    ).toBe(409);
    expect((await Tour.findById(tour._id)).slots[2].bookedSeats).toBe(0);
  });
  test('customers only see their own bookings', async () => {
    const own = await customer.get('/api/bookings/mine');
    expect(own.status).toBe(200);
    expect(own.body.length).toBeGreaterThan(0);
    expect(own.body.every((booking) => booking.user === customerId)).toBe(true);
    const other = request.agent(app);
    await other
      .post('/api/auth/login')
      .send({ email: 'not-staff@example.com', password: details.password });
    expect((await other.get('/api/bookings/mine')).body).toEqual([]);
  });
});

describe('Staff management and customer confirmation', () => {
  let reservation;
  beforeAll(async () => {
    const response = await customer.post('/api/bookings').send(bookingBody({ guests: 1 }));
    reservation = response.body;
  });
  test('confirmation is restricted to the booking owner', async () => {
    const owned = await customer.get(`/api/bookings/${reservation._id}`);
    expect(owned.status).toBe(200);
    expect(owned.body.tour.title).toBe(tour.title);
    expect((await staff.get(`/api/bookings/${reservation._id}`)).status).toBe(404);
    expect((await request(app).get(`/api/bookings/${reservation._id}`)).status).toBe(401);
    expect((await customer.get('/api/bookings/invalid')).status).toBe(400);
  });
  test('staff endpoints reject guests and customers', async () => {
    expect((await request(app).get('/api/staff/bookings')).status).toBe(401);
    expect((await customer.get('/api/staff/bookings')).status).toBe(403);
    expect(
      (
        await customer
          .patch(`/api/staff/bookings/${reservation._id}/status`)
          .send({ status: 'confirmed' })
      ).status,
    ).toBe(403);
  });
  test('staff can search, filter and inspect summary counts', async () => {
    const result = await staff
      .get('/api/staff/bookings')
      .query({ search: reservation.reference, status: 'pending' });
    expect(result.status).toBe(200);
    expect(result.body.bookings).toHaveLength(1);
    expect(result.body.bookings[0].contactEmail).toBe(details.email);
    expect(result.body.summary.total).toBe(await Booking.countDocuments());
    expect(result.body.pagination.total).toBe(1);
    expect(
      (await staff.get('/api/staff/bookings').query({ search: tour.title })).body.bookings.length,
    ).toBeGreaterThan(0);
    expect((await staff.get('/api/staff/bookings').query({ search: '.*' })).body.bookings).toEqual(
      [],
    );
    expect((await staff.get('/api/staff/bookings').query({ status: 'unknown' })).status).toBe(400);
    expect((await staff.get('/api/staff/bookings').query({ page: 0 })).status).toBe(400);
  });
  test('confirming is idempotent and does not change reserved seats', async () => {
    const before = (await Tour.findById(tour._id)).slots[0].bookedSeats;
    for (let i = 0; i < 2; i++) {
      const response = await staff
        .patch(`/api/staff/bookings/${reservation._id}/status`)
        .send({ status: 'confirmed' });
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('confirmed');
    }
    expect((await Tour.findById(tour._id)).slots[0].bookedSeats).toBe(before);
    expect((await customer.get(`/api/bookings/${reservation._id}`)).body.status).toBe('confirmed');
  });
  test('concurrent cancellations release capacity exactly once', async () => {
    const before = (await Tour.findById(tour._id)).slots[0].bookedSeats;
    const responses = await Promise.all(
      [1, 2].map(() =>
        staff.patch(`/api/staff/bookings/${reservation._id}/status`).send({ status: 'cancelled' }),
      ),
    );
    expect(responses.map((response) => response.status)).toEqual([200, 200]);
    expect((await Tour.findById(tour._id)).slots[0].bookedSeats).toBe(before - reservation.guests);
    expect((await Booking.findById(reservation._id)).status).toBe('cancelled');
    expect(
      (
        await staff
          .patch(`/api/staff/bookings/${reservation._id}/status`)
          .send({ status: 'confirmed' })
      ).status,
    ).toBe(409);
    expect((await customer.get(`/api/bookings/${reservation._id}`)).body.status).toBe('cancelled');
  });
  test('invalid status changes and missing bookings are rejected', async () => {
    expect(
      (
        await staff
          .patch(`/api/staff/bookings/${reservation._id}/status`)
          .send({ status: 'pending' })
      ).status,
    ).toBe(400);
    expect(
      (await staff.patch('/api/staff/bookings/bad/status').send({ status: 'confirmed' })).status,
    ).toBe(400);
    expect(
      (
        await staff
          .patch(`/api/staff/bookings/${new mongoose.Types.ObjectId()}/status`)
          .send({ status: 'confirmed' })
      ).status,
    ).toBe(404);
  });
  test('cancellation rolls back when the seat release fails', async () => {
    const response = await customer.post('/api/bookings').send(bookingBody({ guests: 1 }));
    const id = response.body._id;
    const before = (await Tour.findById(tour._id)).slots[0].bookedSeats;
    const update = jest.spyOn(Tour, 'updateOne').mockResolvedValueOnce({ modifiedCount: 0 });
    try {
      expect(
        (await staff.patch(`/api/staff/bookings/${id}/status`).send({ status: 'cancelled' }))
          .status,
      ).toBe(409);
      expect((await Booking.findById(id)).status).toBe('pending');
      expect((await Tour.findById(tour._id)).slots[0].bookedSeats).toBe(before);
    } finally {
      update.mockRestore();
    }
  });
});
