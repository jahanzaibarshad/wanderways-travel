import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { departureDate, money } from '../api/format.js';

export default function MyBookingsPage() {
  const [state, setState] = useState({ loading: true, bookings: [], error: '' });
  const [retry, setRetry] = useState(0);
  function reload() {
    setState((previous) => ({ ...previous, loading: true, error: '' }));
    setRetry((value) => value + 1);
  }
  useEffect(() => {
    let active = true;
    api('/bookings/mine')
      .then((bookings) => {
        if (active) setState({ loading: false, bookings, error: '' });
      })
      .catch((error) => {
        if (active) setState({ loading: false, bookings: [], error: error.message });
      });
    return () => {
      active = false;
    };
  }, [retry]);
  return (
    <section className="section bookings-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Your travel journal</p>
          <h2>My bookings</h2>
        </div>
        <div className="page-actions">
          <button className="button button-outline" disabled={state.loading} onClick={reload}>
            Refresh bookings
          </button>
          <Link className="button button-outline" to="/tours">
            Find your next journey
          </Link>
        </div>
      </div>
      {state.loading && <p role="status">Loading your reservations…</p>}
      {state.error && (
        <div role="alert">
          <p className="form-error">{state.error}</p>
          <button className="button button-outline" onClick={reload}>
            Try again
          </button>
        </div>
      )}
      {!state.loading && !state.error && !state.bookings.length && (
        <div className="empty-state">
          <h3>Your story is still unwritten.</h3>
          <p>Choose a journey and your reservations will appear here.</p>
          <Link to="/tours" className="button button-primary">
            Explore tours
          </Link>
        </div>
      )}
      <div className="bookings-grid">
        {state.bookings.map((booking) => (
          <article key={booking._id} className="reservation-summary">
            <span className={`status-badge status-${booking.status}`}>{booking.status}</span>
            <p className="eyebrow">{booking.tour?.destination || 'Journey'}</p>
            <h3>{booking.tour?.title || 'Tour no longer available'}</h3>
            <p>
              {departureDate(booking.date)} · {booking.guests} guest
              {booking.guests === 1 ? '' : 's'}
            </p>
            <strong>{money(booking.totalPrice)}</strong>
            <p className="booking-reference">{booking.reference}</p>
            <Link className="text-link" to={`/bookings/${booking._id}/confirmation`}>
              View reservation →
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
