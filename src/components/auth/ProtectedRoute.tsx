import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/roles';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole | UserRole[];
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, profile, loading, error } = useAuth();
  const location = useLocation();

  // Handle auth errors
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Errore di Autenticazione</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <Button onClick={() => window.location.reload()} className="w-full">
              Ricarica Pagina
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/auth/login">Vai al Login</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifica autenticazione...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  const requiredRoles = requiredRole
    ? (Array.isArray(requiredRole) ? requiredRole : [requiredRole])
    : null;

  // If role is required, check user role
  if (requiredRoles && requiredRoles.length > 0) {
    // Check if profile exists and has the required role
    if (!profile) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-red-600 mx-auto mb-4" />
            <p className="text-gray-600">Caricamento profilo utente...</p>
          </div>
        </div>
      );
    }

    if (!requiredRoles.includes(profile.role)) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Accesso Negato</h2>
            <p className="text-gray-600 mb-4">
              Non hai i permessi necessari per accedere a questa sezione.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              {requiredRoles.length === 1 ? (
                <>Ruolo richiesto: <span className="font-medium">{requiredRoles[0]}</span></>
              ) : (
                <>Ruoli richiesti: <span className="font-medium">{requiredRoles.join(', ')}</span></>
              )}
              <br />
              Il tuo ruolo: <span className="font-medium">{profile.role}</span>
            </p>
            <Button asChild>
              <Link to="/">Torna alla Dashboard</Link>
            </Button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
export default ProtectedRoute;