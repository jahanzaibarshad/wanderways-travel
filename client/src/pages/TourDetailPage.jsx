import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import BookingForm from '../components/BookingForm.jsx';
import TravelImage from '../components/TravelImage.jsx';
import { getTourPhoto } from '../data/travelPhotos.js';

export default function TourDetailPage() {
  const { id } = useParams();
  const [tour, setTour] = useState(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    api(`/tours/${id}`)
      .then((data) => {
        if (active) {
          setTour(data);
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
  async function refresh() {
    try {
      setTour(await api(`/tours/${id}`));
    } catch {
      /* Keep the original booking error visible. */
    }
  }
  if (error)
    return (
      <section className="section">
        <p role="alert">{error}</p>
        <button
          className="button button-outline"
          onClick={() => {
            setError('');
            setRetry((value) => value + 1);
          }}
        >
          Retry journey
        </button>{' '}
        <Link to="/tours">Back to tours</Link>
      </section>
    );
  if (!tour)
    return (
      <p className="page-status" role="status">
        Loading journey…
      </p>
    );
  return (
    <section className="section detail-section">
      <Link className="text-link" to="/tours">
        ← All journeys
      </Link>
      <div className="journey-layout">
        <div className="journey-story">
          <p className="eyebrow">{tour.destination}</p>
          <h2>{tour.title}</h2>
          <figure className="journey-photo">
            <TravelImage
              photo={getTourPhoto(tour)}
              priority
              sizes="(max-width: 760px) 100vw, 60vw"
            />
            <figcaption>
              {getTourPhoto(tour)?.place || tour.destination} · destination inspiration
            </figcaption>
          </figure>
          <p>{tour.description}</p>
          <p>
            <strong>PKR {tour.price.toLocaleString()} per guest</strong> · {tour.duration} days
          </p>
          <h3>Upcoming departures</h3>
          <ul className="departure-list">
            {tour.slots
              .filter((slot) => new Date(slot.date) > new Date())
              .map((slot) => (
                <li key={slot._id}>
                  <span>
                    {new Date(slot.date).toLocaleDateString('en-PK', {
                      dateStyle: 'long',
                      timeZone: 'Asia/Karachi',
                    })}
                  </span>
                  <strong>{Math.max(0, slot.capacity - slot.bookedSeats)} seats available</strong>
                </li>
              ))}
          </ul>
          <p className="field-hint">
            Choose one of our scheduled departures. Past dates and sold-out departures cannot be
            booked.
          </p>
        </div>
        <BookingForm tour={tour} onRefresh={refresh} />
      </div>
    </section>
  );
}
