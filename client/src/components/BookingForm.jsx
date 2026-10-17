import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';
import { api } from '../api/client.js';
import { departureDate, money } from '../api/format.js';

export default function BookingForm({ tour, onRefresh }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const available = tour.slots.filter((slot) => new Date(slot.date) > new Date());
  const [slotId, setSlotId] = useState('');
  const [guests, setGuests] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const slot = available.find((item) => item._id === slotId);
  const remaining = slot ? Math.max(0, slot.capacity - slot.bookedSeats) : 0;
  const valid =
    slot && Number.isInteger(guests) && guests >= 1 && guests <= Math.min(remaining, 12);
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    if (!valid) {
      setError('Choose an available departure and a valid number of guests.');
      return;
    }
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      const booking = await api('/bookings', {
        method: 'POST',
        body: {
          tourId: tour._id,
          slotId,
          guests,
          contactName: form.get('contactName'),
          contactEmail: form.get('contactEmail'),
          phone: form.get('phone'),
        },
      });
      navigate(`/bookings/${booking._id}/confirmation`, { replace: true });
    } catch (failure) {
      if (failure.status === 401) {
        navigate('/login', { state: { from: `/tours/${tour._id}` } });
        return;
      }
      const message =
        Object.values(failure.fields || {})
          .flat()
          .join('. ') || failure.message;
      setError(
        failure.status
          ? message
          : `${message} Your reservation may have been received. Check My Bookings before submitting again.`,
      );
      if (failure.status === 409) await onRefresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <aside className="reservation-card" id="book">
      <p className="eyebrow">Make it your next story</p>
      <h3>Reserve your place</h3>
      <p>
        <strong>{money(tour.price)}</strong> per guest
      </p>
      {loading ? (
        <p role="status">Checking your session…</p>
      ) : !user ? (
        <div className="booking-login">
          <p>Sign in to select a departure and reserve your seats.</p>
          <Link
            className="button button-primary"
            to="/login"
            state={{ from: `/tours/${tour._id}` }}
          >
            Sign in to book
          </Link>
          <Link to="/register" state={{ from: `/tours/${tour._id}` }}>
            Create an account
          </Link>
        </div>
      ) : user.role !== 'customer' ? (
        <p>You're signed in as staff. Use the dashboard to manage reservations.</p>
      ) : (
        <form onSubmit={submit}>
          <fieldset disabled={busy}>
            <label>
              Departure date
              <select
                required
                value={slotId}
                onChange={(event) => {
                  setSlotId(event.target.value);
                  setGuests(1);
                  setError('');
                }}
              >
                <option value="">Choose a departure</option>
                {available.map((departure) => (
                  <option
                    key={departure._id}
                    value={departure._id}
                    disabled={departure.bookedSeats >= departure.capacity}
                  >
                    {departureDate(departure.date)} ·{' '}
                    {Math.max(0, departure.capacity - departure.bookedSeats)} seats left
                  </option>
                ))}
              </select>
            </label>
            {!available.length && (
              <p role="status">No upcoming departures. Please check another journey.</p>
            )}
            <label>
              Guests
              <input
                aria-describedby="capacity-note"
                type="number"
                min="1"
                max={Math.min(remaining, 12) || 1}
                step="1"
                value={guests}
                required
                disabled={!slot || remaining === 0}
                onChange={(event) => setGuests(Number(event.target.value))}
              />
            </label>
            <p id="capacity-note" className="field-hint">
              {slot
                ? `${remaining} seats available for this departure`
                : 'Select a departure to see availability'}
            </p>
            <label>
              Contact name
              <input
                name="contactName"
                autoComplete="name"
                defaultValue={user.name}
                required
                minLength={2}
                maxLength={80}
              />
            </label>
            <label>
              Email address
              <input
                name="contactEmail"
                type="email"
                autoComplete="email"
                defaultValue={user.email}
                required
                maxLength={254}
              />
            </label>
            <label>
              Phone number
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+92 300 1234567"
                minLength={7}
                maxLength={30}
                required
              />
            </label>
          </fieldset>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="booking-total">
            <span>
              Total for {guests || 0} guest{guests === 1 ? '' : 's'}
            </span>
            <strong>{money(tour.price * (guests || 0))}</strong>
          </div>
          <p className="field-hint">
            No payment is collected online. Your reservation will be reviewed by our team.
          </p>
          <button className="button button-primary" disabled={busy || !valid}>
            {busy ? 'Reserving your seats…' : 'Reserve my place'}
          </button>
        </form>
      )}
    </aside>
  );
}
