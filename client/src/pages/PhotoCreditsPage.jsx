import { travelPhotos } from '../data/travelPhotos.js';
import TravelImage from '../components/TravelImage.jsx';

export default function PhotoCreditsPage() {
  return (
    <section className="section photo-credits">
      <p className="eyebrow">The people behind the perspectives</p>
      <h1>Photography credits</h1>
      <p>
        Real destination photography, selected from Unsplash. These images show the places, not
        guaranteed weather, accommodation or activities on a particular departure.
      </p>
      <p>
        Photos are resized and cropped for display. See the{' '}
        <a
          className="text-link"
          href="https://unsplash.com/license"
          target="_blank"
          rel="noreferrer"
        >
          Unsplash License
        </a>
        .
      </p>
      <div className="credit-grid">
        {Object.values(travelPhotos).map((photo) => (
          <article key={photo.key}>
            <TravelImage photo={photo} sizes="(max-width: 760px) 100vw, 33vw" />
            <h2>{photo.place}</h2>
            <a className="text-link" href={photo.source} target="_blank" rel="noreferrer">
              Photo by {photo.author} on Unsplash ↗
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
