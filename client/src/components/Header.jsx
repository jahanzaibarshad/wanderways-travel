import { Link, NavLink } from 'react-router-dom';
import { useRef, useState } from 'react';
import { useAuth } from '../context/useAuth.js';

function LogoMark() {
  return (
    <span className="logo-mark" aria-hidden="true">
      <svg viewBox="0 0 40 40" role="img">
        <path d="M20 3 24.8 15.2 37 20l-12.2 4.8L20 37l-4.8-12.2L3 20l12.2-4.8L20 3Z" />
        <circle cx="20" cy="20" r="4.2" />
      </svg>
    </span>
  );
}

function Header() {
  const { user, loading, logout } = useAuth();
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef(null);
  async function signOut() {
    try {
      await logout();
      setError('');
    } catch {
      setError('Sign out failed. Please try again.');
    }
  }
  return (
    <header
      className="site-header"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && menuOpen) {
          setMenuOpen(false);
          menuButton.current?.focus();
        }
      }}
    >
      <Link className="brand" to="/" aria-label="WanderWays home">
        <LogoMark />
        <span>WanderWays</span>
      </Link>

      <button
        ref={menuButton}
        type="button"
        className="mobile-menu-toggle"
        aria-expanded={menuOpen}
        aria-controls="header-navigation"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? 'Close menu' : 'Menu'}
        <span aria-hidden="true">{menuOpen ? '×' : '☰'}</span>
      </button>
      <div
        id="header-navigation"
        className={`header-navigation${menuOpen ? ' is-open' : ''}`}
        onClick={(event) => {
          if (event.target.closest('a, button')) setMenuOpen(false);
        }}
      >
        <nav className="main-nav" aria-label="Primary navigation">
          <NavLink to="/tours">Tours</NavLink>
          <a href="/#why-us">Why us</a>
          <NavLink to="/help">Help & FAQ</NavLink>
        </nav>

        <div className="auth-navigation">
          {loading ? (
            <span role="status">Loading…</span>
          ) : user ? (
            <>
              <Link className="workspace-link" to={user.role === 'staff' ? '/staff' : '/bookings'}>
                {user.role === 'staff' ? 'Dashboard' : 'My bookings'}
              </Link>
              <Link to="/account">{user.name.split(' ')[0]}</Link>
              <button className="button button-small button-outline" onClick={signOut}>
                Sign out
              </button>
            </>
          ) : (
            <Link className="button button-small button-outline" to="/login">
              Sign in
            </Link>
          )}
          {error && <span role="alert">{error}</span>}
        </div>
      </div>
    </header>
  );
}

export default Header;
