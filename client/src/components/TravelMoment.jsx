import { Link } from 'react-router-dom';
import TravelImage from './TravelImage.jsx';
import { travelPhotos } from '../data/travelPhotos.js';

export default function TravelMoment() {
  return (
    <section className="travel-moment" aria-labelledby="moment-heading">
      <TravelImage photo={travelPhotos.night} sizes="100vw" />
      <div className="moment-copy">
        <p className="eyebrow">Fairy Meadows, after dark</p>
        <h2 id="moment-heading">
          Some stories start
          <br />
          where the road ends.
        </h2>
        <p>
          A little mountain air. A sky full of possibility. Find a journey that makes you look up.
        </p>
        <Link className="button button-primary" to="/tours?destination=Fairy+Meadows">
          Explore Fairy Meadows <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <span className="moment-caption">Destination inspiration · skies and conditions vary</span>
    </section>
  );
}
