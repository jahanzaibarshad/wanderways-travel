import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const titles = {
  '/': 'Curated journeys, lasting stories',
  '/tours': 'Explore journeys',
  '/login': 'Sign in',
  '/register': 'Create account',
  '/bookings': 'My bookings',
  '/staff': 'Staff reservations',
  '/account': 'Your account',
  '/help': 'Travel & booking help',
  '/photo-credits': 'Photography credits',
};

export default function RouteExperience() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    document.title = `WanderWays | ${titles[pathname] || (pathname.startsWith('/tours/') ? 'Journey details' : pathname.startsWith('/bookings/') ? 'Booking details' : 'Page not found')}`;
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView?.();
    else {
      window.scrollTo?.(0, 0);
      document.getElementById('main-content')?.focus({ preventScroll: true });
    }
  }, [pathname, hash]);
  return null;
}
