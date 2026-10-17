import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import TourCard from './TourCard.jsx';

export default function TourPreview() {
  const [state, setState] = useState({ loading: true, tours: [], error: '' });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    api('/tours')
      .then((tours) => {
        if (active) setState({ loading: false, tours: tours.slice(0, 3), error: '' });
      })
      .catch((error) => {
        if (active) setState({ loading: false, tours: [], error: error.message });
      });
    return () => {
      active = false;
    };
  }, [retry]);
  return (
    <section className="section tours-section" id="tours">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Journeys worth taking</p>
          <h2>Choose your next story</h2>
        </div>
        <p>Explore real journeys, current prices and upcoming departures from our collection.</p>
      </div>
      {state.loading && <p role="status">Loading featured journeys…</p>}
      {state.error && (
        <div role="alert">
          <p>{state.error}</p>
          <button className="button button-outline" onClick={() => setRetry(retry + 1)}>
            Retry featured tours
          </button>
        </div>
      )}
      {!state.loading && !state.error && !state.tours.length && (
        <p>New journeys are on the way. Check back for departures.</p>
      )}
      <div className="tour-grid">
        {state.tours.map((tour, index) => (
          <TourCard key={tour._id} tour={tour} index={index} />
        ))}
      </div>
      <p className="coming-soon-note">
        <Link to="/tours" className="text-link">
          Explore all departures →
        </Link>
      </p>
    </section>
  );
}
