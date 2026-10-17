import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import TourCard from '../components/TourCard.jsx';

export default function ToursPage() {
  const [state, setState] = useState({ loading: true, tours: [], error: '' });
  const [retry, setRetry] = useState(0);
  const [params, setParams] = useSearchParams();
  const search = params.get('search') || '';
  const destination = params.get('destination') || '';
  const sort = params.get('sort') || '';
  const availableOnly = params.get('available') === 'true';
  function change(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }
  const destinations = [...new Set(state.tours.map((tour) => tour.destination))].sort();
  const filtered = state.tours
    .filter((tour) => {
      const matches = `${tour.title} ${tour.destination} ${tour.description || ''}`
        .toLowerCase()
        .includes(search.trim().toLowerCase());
      const available = (tour.slots || []).some(
        (slot) => new Date(slot.date) > new Date() && slot.bookedSeats < slot.capacity,
      );
      return (
        matches &&
        (!destination || tour.destination === destination) &&
        (!availableOnly || available)
      );
    })
    .sort((a, b) =>
      sort === 'price-asc'
        ? a.price - b.price
        : sort === 'price-desc'
          ? b.price - a.price
          : sort === 'duration'
            ? a.duration - b.duration
            : 0,
    );
  useEffect(() => {
    let active = true;
    api('/tours')
      .then((tours) => {
        if (active) setState({ loading: false, tours, error: '' });
      })
      .catch((error) => {
        if (active) setState({ loading: false, tours: [], error: error.message });
      });
    return () => {
      active = false;
    };
  }, [retry]);
  return (
    <section className="section tours-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Journeys worth taking</p>
          <h2>Find your next story</h2>
        </div>
        <p>Browse our curated departures. Every journey brings you closer to local life.</p>
      </div>
      <div className="tour-filters" role="search" aria-label="Find tours">
        <label>
          Search journeys
          <input
            type="search"
            placeholder="Try Hunza or mountains"
            maxLength={100}
            value={search}
            onChange={(event) => change('search', event.target.value)}
          />
        </label>
        <label>
          Destination
          <select
            value={destination}
            onChange={(event) => change('destination', event.target.value)}
          >
            <option value="">All destinations</option>
            {destination && !destinations.includes(destination) && (
              <option value={destination}>{destination}</option>
            )}
            {destinations.map((place) => (
              <option key={place}>{place}</option>
            ))}
          </select>
        </label>
        <label>
          Sort by
          <select value={sort} onChange={(event) => change('sort', event.target.value)}>
            <option value="">Recommended</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="duration">Shortest journeys</option>
          </select>
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(event) => change('available', event.target.checked ? 'true' : '')}
          />
          Available departures only
        </label>
        <button
          type="button"
          className="button button-outline"
          onClick={() => setParams({}, { replace: true })}
        >
          Clear filters
        </button>
      </div>
      {state.loading && <p role="status">Finding your next adventure…</p>}
      {state.error && (
        <div role="alert">
          <p className="form-error">{state.error}</p>
          <button className="button button-outline" onClick={() => setRetry(retry + 1)}>
            Try again
          </button>
        </div>
      )}
      {!state.loading && !state.error && state.tours.length === 0 && (
        <p>No tours available yet. Please check back soon.</p>
      )}
      {!state.loading && !state.error && state.tours.length > 0 && (
        <p role="status">
          {filtered.length} journey{filtered.length === 1 ? '' : 's'} found
        </p>
      )}
      {!state.loading && !state.error && state.tours.length > 0 && !filtered.length && (
        <div className="empty-state">
          <h3>No journeys match your search</h3>
          <p>Try another destination or clear your filters.</p>
        </div>
      )}
      <div className="tour-grid">
        {filtered.map((tour, index) => (
          <TourCard key={tour._id} tour={tour} index={index} />
        ))}
      </div>
    </section>
  );
}
