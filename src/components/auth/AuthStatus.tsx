import { useAuth } from '../../hooks/useAuth';
import { Loader2, User, LogIn, LogOut } from 'lucide-react'; // 1. Aggiunta l'icona LogOut
import { Button } from '../ui/button';
import { Link, useNavigate } from 'react-router-dom'; // 2. Aggiunto useNavigate

export const AuthStatus = () => {
  // 3. Prendiamo anche la funzione signOut e il profilo
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate(); // 4. Inizializziamo la funzione di navigazione

  // 5. Creiamo una funzione per gestire il logout e il redirect
  const handleLogout = async () => {
    await signOut(); // Aspetta che il logout sia completato
    navigate('/auth/login', { replace: true }); // E POI reindirizza alla pagina di login
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-neutral-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Caricamento...</span>
      </div>
    );
  }

  // 6. Modifichiamo la vista per quando l'utente è loggato
  if (user) {
    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-2 text-neutral-300">
          <User className="w-4 h-4" />
          <div className="text-sm">
            <p className="font-semibold truncate">{profile?.full_name || user.email}</p>
            <p className="text-xs text-neutral-400">{profile?.role}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
          <LogOut className="w-4 h-4 text-neutral-400 hover:text-white" />
        </Button>
      </div>
    );
  }

  // La vista per l'utente non loggato rimane la stessa
  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-2 text-amber-500">
        <LogIn className="w-4 h-4" />
        <span className="text-sm">Accesso non effettuato</span>
      </div>
      <Button asChild size="sm" variant="outline">
        <Link to="/auth/login">
          Accedi
        </Link>
      </Button>
    </div>
  );
};