import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '../context/useAuth.js';
import { api } from '../api/client.js';
import TourDetailPage from '../pages/TourDetailPage.jsx';
import ToursPage from '../pages/ToursPage.jsx';
import ConfirmationPage from '../pages/ConfirmationPage.jsx';
import MyBookingsPage from '../pages/MyBookingsPage.jsx';
import StaffDashboardPage from '../pages/StaffDashboardPage.jsx';
import ProtectedRoute from '../components/ProtectedRoute.jsx';

vi.mock('../api/client.js', () => ({ api: vi.fn() }));
const traveller = {
  id: 'customer-1',
  name: 'Ali Traveller',
  email: 'ali@example.com',
  role: 'customer',
};
let tour;
let booking;
let stored;
const future = (days) => new Date(Date.now() + days * 86400000).toISOString();
function preview(path = '/tours', user = traveller) {
  return render(
    <AuthContext.Provider value={{ user, loading: false }}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/tours" element={<ToursPage />} />
          <Route path="/tours/:id" element={<TourDetailPage />} />
          <Route
            path="/bookings/:id/confirmation"
            element={
              <ProtectedRoute role="customer">
                <ConfirmationPage />
              </ProtectedRoute>
            }
          />
          <Route path="/bookings" element={<MyBookingsPage />} />
          <Route
            path="/staff"
            element={
              <ProtectedRoute role="staff">
                <StaffDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/login"
            element={
              <>
                <h1>Sign in</h1>
                <Link to="/tours">Tours</Link>
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}
beforeEach(() => {
  tour = {
    _id: 'tour-1',
    title: 'Hunza Adventure',
    destination: 'Hunza',
    description: 'A mountain escape.',
    price: 92000,
    duration: 7,
    slots: [
      { _id: 'open-slot', date: future(14), capacity: 12, bookedSeats: 10 },
      { _id: 'full-slot', date: future(28), capacity: 12, bookedSeats: 12 },
      { _id: 'past-slot', date: future(-10), capacity: 12, bookedSeats: 0 },
    ],
  };
  booking = {
    _id: 'booking-1',
    reference: 'WW-TEST-REFERENCE',
    tour,
    date: tour.slots[0].date,
    guests: 2,
    totalPrice: 184000,
    status: 'pending',
    contactName: traveller.name,
    contactEmail: traveller.email,
    phone: '+92 300 1234567',
  };
  stored = [];
  api.mockReset();
  api.mockImplementation(async (path, options) => {
    if (path === '/tours') return [tour];
    if (path === '/tours/tour-1') return tour;
    if (path === '/bookings' && options?.method === 'POST') {
      stored.push(booking);
      return booking;
    }
    if (path === '/bookings/booking-1') return booking;
    if (path === '/bookings/mine') return stored;
    if (path.startsWith('/staff/bookings?'))
      return {
        bookings: [booking],
        pagination: { page: 1, pages: 1, total: 1 },
        summary: {
          total: 1,
          pending: booking.status === 'pending' ? 1 : 0,
          confirmed: booking.status === 'confirmed' ? 1 : 0,
          cancelled: booking.status === 'cancelled' ? 1 : 0,
        },
      };
    if (path === '/staff/bookings/booking-1/status') {
      booking = { ...booking, status: options.body.status };
      return booking;
    }
    throw new Error(`Unexpected API request: ${path}`);
  });
});
describe('Customer booking experience', () => {
  it('browses a tour, selects a date, books, shows a reference and lists the reservation', async () => {
    const user = userEvent.setup();
    preview();
    await user.click(await screen.findByRole('link', { name: /view journey/i }));
    await user.selectOptions(await screen.findByLabelText('Departure date'), 'open-slot');
    const guests = screen.getByLabelText('Guests');
    await user.clear(guests);
    await user.type(guests, '2');
    await user.type(screen.getByLabelText('Phone number'), '+92 300 1234567');
    await user.click(screen.getByRole('button', { name: 'Reserve my place' }));
    expect(
      await screen.findByRole('heading', { name: 'Your place is reserved.' }),
    ).toBeInTheDocument();
    expect(screen.getByText('WW-TEST-REFERENCE')).toBeInTheDocument();
    expect(api).toHaveBeenCalledWith(
      '/bookings',
      expect.objectContaining({
        body: expect.objectContaining({
          tourId: 'tour-1',
          slotId: 'open-slot',
          guests: 2,
          contactEmail: traveller.email,
        }),
      }),
    );
    await user.click(screen.getByRole('link', { name: 'My bookings' }));
    expect(await screen.findByText('WW-TEST-REFERENCE')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
  });
  it('excludes past dates and disables sold-out departures', async () => {
    preview('/tours/tour-1');
    const select = await screen.findByLabelText('Departure date');
    expect(select.querySelector('option[value="past-slot"]')).toBeNull();
    expect(select.querySelector('option[value="full-slot"]')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reserve my place' })).toBeDisabled();
  });
  it('prevents guests beyond capacity and validates required contact fields', async () => {
    const user = userEvent.setup();
    preview('/tours/tour-1');
    await user.selectOptions(await screen.findByLabelText('Departure date'), 'open-slot');
    const guests = screen.getByLabelText('Guests');
    await user.clear(guests);
    await user.type(guests, '3');
    expect(screen.getByRole('button', { name: 'Reserve my place' })).toBeDisabled();
    await user.clear(guests);
    await user.type(guests, '2');
    await user.click(screen.getByRole('button', { name: 'Reserve my place' }));
    expect(api.mock.calls.some(([path]) => path === '/bookings')).toBe(false);
    expect(screen.getByLabelText('Phone number')).toBeInvalid();
  });
  it('refreshes availability and shows a booking conflict', async () => {
    const implementation = api.getMockImplementation();
    api.mockImplementation((path, options) =>
      path === '/bookings'
        ? Promise.reject(
            Object.assign(new Error('Departure has insufficient seats'), { status: 409 }),
          )
        : implementation(path, options),
    );
    const user = userEvent.setup();
    preview('/tours/tour-1');
    await user.selectOptions(await screen.findByLabelText('Departure date'), 'open-slot');
    await user.type(screen.getByLabelText('Phone number'), '+92 300 1234567');
    await user.click(screen.getByRole('button', { name: 'Reserve my place' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('insufficient seats');
    await waitFor(() =>
      expect(api.mock.calls.filter(([path]) => path === '/tours/tour-1')).toHaveLength(2),
    );
  });
  it('asks signed-out visitors to log in', async () => {
    const user = userEvent.setup();
    preview('/tours/tour-1', null);
    await user.click(await screen.findByRole('link', { name: 'Sign in to book' }));
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });
  it('warns about uncertain booking delivery instead of encouraging duplicate submission', async () => {
    const implementation = api.getMockImplementation();
    api.mockImplementation((path, options) =>
      path === '/bookings'
        ? Promise.reject(new Error('Connection lost'))
        : implementation(path, options),
    );
    const user = userEvent.setup();
    preview('/tours/tour-1');
    await user.selectOptions(await screen.findByLabelText('Departure date'), 'open-slot');
    await user.type(screen.getByLabelText('Phone number'), '+92 300 1234567');
    await user.click(screen.getByRole('button', { name: 'Reserve my place' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Check My Bookings before submitting again',
    );
    expect(api.mock.calls.filter(([path]) => path === '/bookings')).toHaveLength(1);
  });
  it('loads confirmation directly after refresh', async () => {
    preview('/bookings/booking-1/confirmation');
    expect(await screen.findByText('WW-TEST-REFERENCE')).toBeInTheDocument();
  });
  it('shows the empty bookings state', async () => {
    preview('/bookings');
    expect(await screen.findByText('Your story is still unwritten.')).toBeInTheDocument();
  });
});
describe('Staff reservation experience', () => {
  const staff = { ...traveller, role: 'staff' };
  it('returns to a valid page when a refresh reduces the number of result pages', async () => {
    let shrunk = false;
    api.mockImplementation(async (path) => {
      const page = Number(new URLSearchParams(path.split('?')[1]).get('page'));
      return {
        bookings: shrunk && page > 1 ? [] : [booking],
        pagination: { page, pages: shrunk ? 1 : 2, total: shrunk ? 1 : 21 },
        summary: { total: 21, pending: 21, confirmed: 0, cancelled: 0 },
      };
    });
    const user = userEvent.setup();
    preview('/staff', staff);
    await screen.findByText('Page 1 of 2');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByText('Page 2 of 2');
    shrunk = true;
    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    await screen.findByText('Page 1 of 1');
    expect(screen.getByText('WW-TEST-REFERENCE')).toBeInTheDocument();
  });
  it('blocks customers from the staff page without requesting bookings', () => {
    preview('/staff');
    expect(screen.getByRole('heading', { name: 'Access restricted' })).toBeInTheDocument();
    expect(api).not.toHaveBeenCalled();
  });
  it('confirms a pending reservation', async () => {
    const user = userEvent.setup();
    preview('/staff', staff);
    await user.click(await screen.findByRole('button', { name: 'Confirm' }));
    await waitFor(() =>
      expect(api).toHaveBeenCalledWith('/staff/bookings/booking-1/status', {
        method: 'PATCH',
        body: { status: 'confirmed' },
      }),
    );
    expect(await screen.findByText('Reservation WW-TEST-REFERENCE confirmed.')).toBeInTheDocument();
  });
  it('requires cancellation confirmation and allows keeping the reservation', async () => {
    const user = userEvent.setup();
    preview('/staff', staff);
    await user.click(await screen.findByRole('button', { name: 'Cancel', exact: true }));
    expect(screen.getByRole('group', { name: 'Confirm cancellation' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Keep reservation' }));
    expect(api.mock.calls.some(([, options]) => options?.method === 'PATCH')).toBe(false);
    await user.click(screen.getByRole('button', { name: 'Cancel', exact: true }));
    await user.click(screen.getByRole('button', { name: 'Yes, cancel reservation' }));
    expect(await screen.findByText('Reservation WW-TEST-REFERENCE cancelled.')).toBeInTheDocument();
  });
  it('passes search and status filters to the API', async () => {
    const user = userEvent.setup();
    preview('/staff', staff);
    await screen.findByText('WW-TEST-REFERENCE');
    await user.type(screen.getByLabelText('Search reservations'), 'Ali');
    await user.click(screen.getByRole('button', { name: 'Search', exact: true }));
    await waitFor(() => expect(api).toHaveBeenCalledWith('/staff/bookings?page=1&search=Ali'));
    await user.selectOptions(screen.getByLabelText('Status'), 'pending');
    await waitFor(() =>
      expect(api).toHaveBeenCalledWith('/staff/bookings?page=1&status=pending&search=Ali'),
    );
  });
});
