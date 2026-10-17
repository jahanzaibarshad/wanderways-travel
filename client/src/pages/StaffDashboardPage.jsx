import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { departureDate, money } from '../api/format.js';

export default function StaffDashboardPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState({ search: '', status: '', page: 1 });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState('');
  const [cancelling, setCancelling] = useState(null);
  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({ page: String(filter.page) });
    if (filter.status) query.set('status', filter.status);
    if (filter.search) query.set('search', filter.search);
    api(`/staff/bookings?${query}`)
      .then((result) => {
        if (active) {
          if (result.pagination.page > result.pagination.pages) {
            setFilter((previous) => ({ ...previous, page: result.pagination.pages }));
            return;
          }
          setData(result);
          setError('');
        }
      })
      .catch((failure) => {
        if (active) setError(failure.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filter, refresh]);
  function apply(next) {
    setLoading(true);
    setFilter(next);
  }
  async function update(booking, status) {
    if (busy) return;
    setBusy(booking._id);
    setError('');
    setNotice('');
    try {
      await api(`/staff/bookings/${booking._id}/status`, { method: 'PATCH', body: { status } });
      setNotice(`Reservation ${booking.reference} ${status}.`);
      setCancelling(null);
      setLoading(true);
      setRefresh((value) => value + 1);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy('');
    }
  }
  return (
    <section className="dashboard-section">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">WanderWays staff workspace</p>
          <h2>Reservations</h2>
          <p>Keep every traveller's next chapter on track.</p>
        </div>
        <button
          className="button button-outline"
          disabled={loading || !!busy}
          onClick={() => {
            setLoading(true);
            setRefresh(refresh + 1);
          }}
        >
          Refresh
        </button>
      </div>
      <div className="dashboard-stats">
        {['total', 'pending', 'confirmed', 'cancelled'].map((status) => (
          <div key={status}>
            <span>{status === 'total' ? 'All reservations' : status}</span>
            <strong>{data?.summary[status] ?? '—'}</strong>
          </div>
        ))}
      </div>
      <form
        className="dashboard-filters"
        onSubmit={(event) => {
          event.preventDefault();
          apply({ ...filter, search: search.trim(), page: 1 });
        }}
      >
        <label>
          Search reservations
          <input
            type="search"
            value={search}
            maxLength={100}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Reference, guest or journey"
          />
        </label>
        <label>
          Status
          <select
            value={filter.status}
            onChange={(event) => apply({ ...filter, status: event.target.value, page: 1 })}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <button className="button button-primary" disabled={loading}>
          Search
        </button>
      </form>
      {error && (
        <div role="alert" className="form-error">
          {error}{' '}
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setRefresh(refresh + 1);
            }}
          >
            Try again
          </button>
        </div>
      )}
      {notice && (
        <p role="status" className="success-notice">
          {notice}
        </p>
      )}
      {cancelling && (
        <div className="cancel-panel" role="group" aria-label="Confirm cancellation">
          <h3>Cancel {cancelling.reference}?</h3>
          <p>This releases {cancelling.guests} seat(s). A cancelled booking cannot be reopened.</p>
          <button
            className="button button-danger"
            disabled={!!busy}
            onClick={() => update(cancelling, 'cancelled')}
          >
            {busy ? 'Cancelling…' : 'Yes, cancel reservation'}
          </button>
          <button
            className="button button-outline"
            disabled={!!busy}
            onClick={() => setCancelling(null)}
          >
            Keep reservation
          </button>
        </div>
      )}
      {loading ? (
        <p role="status" className="page-status">
          Loading reservations…
        </p>
      ) : (
        data &&
        !error && (
          <>
            <div className="table-scroll">
              <table className="reservations-table">
                <caption>{data.pagination.total} matching reservation(s)</caption>
                <thead>
                  <tr>
                    <th scope="col">Reference / guest</th>
                    <th scope="col">Journey</th>
                    <th scope="col">Departure</th>
                    <th scope="col">Guests / total</th>
                    <th scope="col">Status</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bookings.map((booking) => (
                    <tr key={booking._id}>
                      <td>
                        <strong className="booking-reference">{booking.reference}</strong>
                        <span>{booking.contactName}</span>
                        <a href={`mailto:${booking.contactEmail}`}>{booking.contactEmail}</a>
                        <span>{booking.phone}</span>
                      </td>
                      <td>
                        {booking.tour?.title || 'Tour unavailable'}
                        <small>{booking.tour?.destination}</small>
                      </td>
                      <td>{departureDate(booking.date)}</td>
                      <td>
                        {booking.guests} guest(s)<small>{money(booking.totalPrice)}</small>
                      </td>
                      <td>
                        <span className={`status-badge status-${booking.status}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          {booking.status === 'pending' && (
                            <button
                              disabled={!!busy}
                              className="action-confirm"
                              onClick={() => update(booking, 'confirmed')}
                            >
                              {busy === booking._id ? 'Updating…' : 'Confirm'}
                            </button>
                          )}
                          {booking.status !== 'cancelled' && (
                            <button
                              disabled={!!busy}
                              className="action-cancel"
                              onClick={() => setCancelling(booking)}
                            >
                              Cancel
                            </button>
                          )}
                          {booking.status === 'cancelled' && <span>Closed</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data.bookings.length && (
                <div className="empty-state">
                  <h3>No matching reservations</h3>
                  <p>Try another search or status filter.</p>
                </div>
              )}
            </div>
            <div className="pagination">
              <button
                className="button button-outline"
                disabled={filter.page <= 1 || !!busy}
                onClick={() => apply({ ...filter, page: filter.page - 1 })}
              >
                Previous
              </button>
              <span>
                Page {data.pagination.page} of {data.pagination.pages}
              </span>
              <button
                className="button button-outline"
                disabled={filter.page >= data.pagination.pages || !!busy}
                onClick={() => apply({ ...filter, page: filter.page + 1 })}
              >
                Next
              </button>
            </div>
          </>
        )
      )}
    </section>
  );
}
