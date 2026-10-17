import Footer from './components/Footer.jsx';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import TourPreview from './components/TourPreview.jsx';
import WhyWanderWays from './components/WhyWanderWays.jsx';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import AuthPage from './pages/AuthPage.jsx';
import ToursPage from './pages/ToursPage.jsx';
import TourDetailPage from './pages/TourDetailPage.jsx';
import { useAuth } from './context/useAuth.js';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import MyBookingsPage from './pages/MyBookingsPage.jsx';
import ConfirmationPage from './pages/ConfirmationPage.jsx';
import StaffDashboardPage from './pages/StaffDashboardPage.jsx';
import HelpPage from './pages/HelpPage.jsx';
import RouteExperience from './components/RouteExperience.jsx';
import TravelMoment from './components/TravelMoment.jsx';
import PhotoCreditsPage from './pages/PhotoCreditsPage.jsx';

function App() {
  const { user } = useAuth();
  const location = useLocation();
  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <RouteExperience />
      <Header />
      <main id="main-content" tabIndex={-1}>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Hero />
                <TourPreview />
                <WhyWanderWays />
                <TravelMoment />
              </>
            }
          />
          <Route path="/tours" element={<ToursPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/photo-credits" element={<PhotoCreditsPage />} />
          <Route path="/tours/:id" element={<TourDetailPage key={location.pathname} />} />
          <Route path="/login" element={<AuthPage key="login" mode="login" />} />
          <Route path="/register" element={<AuthPage key="register" mode="register" />} />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute role="customer">
                <MyBookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings/:id/confirmation"
            element={
              <ProtectedRoute role="customer">
                <ConfirmationPage key={location.pathname} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <ProtectedRoute role="staff">
                <StaffDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <section className="section">
                  <h2>Your account</h2>
                  {user ? (
                    <>
                      <p>Welcome, {user.name}.</p>
                      <p>Email: {user.email}</p>
                      <p>Account type: {user.role}</p>
                      <Link className="button button-primary" to="/tours">
                        Explore tours
                      </Link>
                      <p>
                        <Link className="text-link" to="/help">
                          Questions about your reservation? Read booking help →
                        </Link>
                      </p>
                      <Link
                        className="button button-outline"
                        to={user.role === 'staff' ? '/staff' : '/bookings'}
                      >
                        {user.role === 'staff' ? 'Manage reservations' : 'My bookings'}
                      </Link>
                    </>
                  ) : (
                    <Link to="/login">Sign in to your account</Link>
                  )}
                </section>
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={
              <section className="section">
                <h2>Page not found</h2>
                <Link to="/">Return home</Link>
              </section>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
