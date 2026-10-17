import { Link } from 'react-router-dom';
import { money, departureDate } from '../api/format.js';
import TravelImage from './TravelImage.jsx';
import { getTourPhoto } from '../data/travelPhotos.js';

export default function TourCard({ tour, index = 0 }) {
  const departures = (tour.slots || [])
    .filter((slot) => new Date(slot.date) > new Date() && slot.bookedSeats < slot.capacity)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  return (
    <article className="tour-card">
      <div
        className={`tour-visual ${['tour-visual-hunza', 'tour-visual-skardu', 'tour-visual-swat'][index % 3]}`}
      >
        <span>{departures.length ? 'Small group escape' : 'No available departures'}</span>
        <TravelImage
          photo={getTourPhoto(tour)}
          sizes="(max-width: 760px) 100vw, (max-width: 1000px) 50vw, 33vw"
        />
      </div>
      <div className="tour-content">
        <p>{tour.destination}</p>
        <h3>{tour.title}</h3>
        <div className="tour-meta">
          <span>{tour.duration} days</span>
          <strong>{money(tour.price)}</strong>
        </div>
        <p className="field-hint">
          {departures.length
            ? `Next departure: ${departureDate(departures[0].date)}`
            : 'Check back for future dates'}{' '}
          · per guest
        </p>
        <Link
          className="text-link"
          to={`/tours/${tour._id}`}
          aria-label={`View journey: ${tour.title}`}
        >
          View journey →
        </Link>
      </div>
    </article>
  );
}
