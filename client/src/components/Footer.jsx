import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="site-footer" id="contact">
      <div>
        <Link className="brand brand-footer" to="/">
          WanderWays
        </Link>
        <p>Curated journeys. Lasting stories.</p>
      </div>
      <div className="footer-contact">
        <Link to="/tours">Explore journeys</Link>
        <Link to="/help">Booking help & FAQ</Link>
        <Link to="/photo-credits">Photography credits</Link>
        <small>Tour reservations · no online payments</small>
      </div>
      <p className="copyright">© {new Date().getFullYear()} WanderWays Travel</p>
    </footer>
  );
}

export default Footer;
