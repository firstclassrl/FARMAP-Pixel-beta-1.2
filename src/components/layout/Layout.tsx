import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useUI } from '../../store/useStore';
import { cn } from '../../lib/cn';
import { useAuth } from '../../hooks/useAuth';
import { LoadingFallback } from '../LoadingFallback';
import { AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';

export const Layout = () => {
  const { sidebarCollapsed } = useUI();
  const { loading, error } = useAuth();

  // Show loading state while auth is being verified
  if (loading) {
    return <LoadingFallback message="Caricamento layout..." />;
  }

  // Show error state if auth failed
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Errore di Layout</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Ricarica Pagina
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-full mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
export default Layout;
