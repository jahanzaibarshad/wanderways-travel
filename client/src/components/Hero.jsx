import { Link } from 'react-router-dom';
import TravelImage from './TravelImage.jsx';
import { travelPhotos } from '../data/travelPhotos.js';

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-copy">
        <p className="eyebrow">
          <span /> Small groups. Big stories.
        </p>
        <h1>
          Go further than the <em>guidebook.</em>
        </h1>
        <p className="hero-description">
          Thoughtfully curated escapes for curious travellers. We handle the details, so you can
          stay present for every unforgettable moment.
        </p>

        <div className="hero-actions">
          <Link className="button button-primary" to="/tours">
            Explore our tours
            <span aria-hidden="true">↗</span>
          </Link>
          <a className="text-link" href="#why-us">
            How we travel <span aria-hidden="true">→</span>
          </a>
        </div>

        <dl className="hero-stats" aria-label="WanderWays highlights">
          <div>
            <dt>Curated</dt>
            <dd>thoughtful journeys</dd>
          </div>
          <div>
            <dt>Local</dt>
            <dd>travel inspiration</dd>
          </div>
          <div>
            <dt>12</dt>
            <dd>guests maximum</dd>
          </div>
        </dl>
      </div>

      <div className="hero-visual" aria-label="A glimpse of Hunza">
        <div className="hero-image-frame">
          <TravelImage photo={travelPhotos.hunza} priority sizes="(max-width: 760px) 90vw, 45vw" />
          <div className="hero-photo-caption">
            <span>A window into the north</span>
            <strong>Somewhere worth slowing down.</strong>
            <small>Attabad Lake, Hunza</small>
          </div>
        </div>

        <div className="floating-card floating-card-top">
          <span className="floating-icon" aria-hidden="true">
            ◇
          </span>
          <span>
            <strong>Local expertise</strong>
            <small>Guides who call it home</small>
          </span>
        </div>

        <div className="floating-card floating-card-bottom">
          <span className="avatar-stack" aria-hidden="true">
            <i>AM</i>
            <i>SK</i>
            <i>+</i>
          </span>
          <span>
            <strong>Make room for adventure</strong>
            <small>Your next story starts here</small>
          </span>
        </div>
      </div>
    </section>
  );
}

export default Hero;
