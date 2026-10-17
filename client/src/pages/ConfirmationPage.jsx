import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { departureDate, money } from '../api/format.js';

export default function ConfirmationPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    api(`/bookings/${id}`)
      .then((data) => {
        if (active) {
          setBooking(data);
          setError('');
        }
      })
      .catch((failure) => {
        if (active) setError(failure.message);
      });
    return () => {
      active = false;
    };
  }, [id, retry]);
  if (error)
    return (
      <section className="section">
        <p role="alert">{error}</p>
        <button className="button button-outline" onClick={() => setRetry(retry + 1)}>
          Try again
        </button>{' '}
        <Link to="/bookings">My bookings</Link>
      </section>
    );
  if (!booking)
    return (
      <p className="page-status" role="status">
        Finding your reservation…
      </p>
    );
  return (
    <section className="confirmation-section">
      <div className="confirmation-card">
        <span className="confirmation-icon" aria-hidden="true">
          ✓
        </span>
        <p className="eyebrow">Your next story is on its way</p>
        <h1>
          {booking.status === 'cancelled' ? 'Reservation cancelled' : 'Your place is reserved.'}
        </h1>
        <p>
          {booking.status === 'pending'
            ? 'Thank you! Our team will review your reservation. You can follow its status in My Bookings.'
            : `Your reservation is ${booking.status}.`}
        </p>
        <div className="reference-box">
          <span>Booking reference</span>
          <strong>{booking.reference}</strong>
        </div>
        <dl className="booking-details">
          <div>
            <dt>Journey</dt>
            <dd>{booking.tour?.title || 'Tour no longer available'}</dd>
          </div>
          <div>
            <dt>Departure</dt>
            <dd>{departureDate(booking.date)}</dd>
          </div>
          <div>
            <dt>Travellers</dt>
            <dd>{booking.guests}</dd>
          </div>
          <div>
            <dt>Reservation status</dt>
            <dd>
              <span className={`status-badge status-${booking.status}`}>{booking.status}</span>
            </dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>{money(booking.totalPrice)}</dd>
          </div>
        </dl>
        <p className="field-hint">No online payment has been taken.</p>
        <div className="page-actions">
          <button className="button button-outline" onClick={() => window.print()}>
            Print reservation
          </button>
          <Link className="button button-primary" to="/bookings">
            My bookings
          </Link>
          <Link className="button button-outline" to="/tours">
            Explore more journeys
          </Link>
        </div>
      </div>
    </section>
  );
}
