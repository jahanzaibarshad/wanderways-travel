import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <p className="page-status" role="status">
        Checking your session…
      </p>
    );
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (role && user.role !== role)
    return (
      <section className="section">
        <h2>Access restricted</h2>
        <p>This page is available to {role} accounts only.</p>
      </section>
    );
  return children;
}
