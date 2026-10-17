import TravelImage from './TravelImage.jsx';
import { travelPhotos } from '../data/travelPhotos.js';

const promises = [
  {
    number: '01',
    title: 'Human-sized groups',
    text: 'Fewer people means more flexibility, better conversations and lighter footprints.',
  },
  {
    number: '02',
    title: 'Rooted in local life',
    text: 'Local guides and family-run stays bring you closer to the places you visit.',
  },
  {
    number: '03',
    title: 'Thoughtful by design',
    text: 'Clear plans, considered pacing and support from your first question to your return home.',
  },
];

function WhyWanderWays() {
  return (
    <section className="section why-section" id="why-us">
      <div className="why-intro">
        <p className="eyebrow eyebrow-light">The WanderWays difference</p>
        <h2>Travel that feels personal, because it is.</h2>
        <p>
          No rushed checklists and no one-size-fits-all itineraries—just carefully paced journeys
          built around people, place and genuine connection.
        </p>
        <figure className="why-travel-photo">
          <TravelImage photo={travelPhotos.swat} sizes="(max-width: 760px) 100vw, 40vw" />
          <figcaption>Take the scenic way. · Kalam, Swat</figcaption>
        </figure>
      </div>

      <ol className="promise-list">
        {promises.map((promise) => (
          <li key={promise.number}>
            <span>{promise.number}</span>
            <div>
              <h3>{promise.title}</h3>
              <p>{promise.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default WhyWanderWays;
