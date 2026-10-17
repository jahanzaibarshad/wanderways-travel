import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';
import TravelImage from '../components/TravelImage.jsx';
import { travelPhotos } from '../data/travelPhotos.js';

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destination = location.state?.from;
  const requestedNext =
    typeof destination === 'string' && destination.startsWith('/') && !destination.startsWith('//')
      ? destination
      : null;
  const next = requestedNext || (auth.user?.role === 'staff' ? '/staff' : '/tours');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  if (auth.loading)
    return (
      <div className="page-status" role="status">
        Checking your session…
      </div>
    );
  if (auth.user) return <Navigate to={next} replace />;

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const data = { email: form.get('email'), password: form.get('password') };
      if (isRegister) data.name = form.get('name');
      const signedIn = await auth[isRegister ? 'register' : 'login'](data);
      navigate(requestedNext || (signedIn?.role === 'staff' ? '/staff' : '/tours'), {
        replace: true,
      });
    } catch (failure) {
      setError(
        Object.values(failure.fields || {})
          .flat()
          .join('. ') || failure.message,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-section">
      <div className="auth-intro">
        <p className="eyebrow">Your next chapter starts here</p>
        <h1>{isRegister ? 'Make room for adventure.' : 'Welcome back, traveller.'}</h1>
        <p>Save your place on a thoughtfully curated journey with WanderWays.</p>
        <figure className="auth-travel-photo">
          <TravelImage photo={travelPhotos.skardu} sizes="(max-width: 760px) 100vw, 45vw" />
          <figcaption>Less ordinary, more unforgettable. · Skardu</figcaption>
        </figure>
      </div>
      <form className="auth-card" onSubmit={submit}>
        <h2>{isRegister ? 'Create your account' : 'Sign in'}</h2>
        <p>
          {isRegister ? 'Join us for your next escape.' : 'Customers and staff can sign in here.'}
        </p>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        {auth.sessionError && <p role="status">{auth.sessionError}</p>}
        {isRegister && (
          <label>
            Full name
            <input name="name" autoComplete="name" minLength={2} maxLength={80} required />
          </label>
        )}
        <label>
          Email address
          <input type="email" name="email" autoComplete="email" maxLength={254} required />
        </label>
        <label>
          Password
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            minLength={8}
            maxLength={72}
            required
          />
        </label>
        <button
          type="button"
          className="password-toggle"
          aria-pressed={showPassword}
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? 'Hide password' : 'Show password'}
        </button>
        {isRegister && (
          <small>Use 8–72 characters. Avoid reusing a password from another account.</small>
        )}
        <button className="button button-primary" disabled={busy}>
          {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
        </button>
        <p>
          {isRegister ? 'Already have an account?' : 'New to WanderWays?'}{' '}
          <Link to={isRegister ? '/login' : '/register'} state={{ from: requestedNext }}>
            {isRegister ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
      </form>
    </section>
  );
}
