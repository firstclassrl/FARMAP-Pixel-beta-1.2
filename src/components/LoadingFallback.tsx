import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
// Removed debug health check to reduce bundle size and noise

interface LoadingFallbackProps {
  message?: string;
  timeout?: number;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({ 
  message = "Caricamento applicazione...", 
  timeout = 15000 
}) => {
  const [showTimeout, setShowTimeout] = useState(false);
  const [healthCheck] = useState<any>(null);
  const [dots, setDots] = useState('');

  // Animated loading dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeout(true);
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout]);

  if (showTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Caricamento Lento</h2>
          <p className="text-gray-600 mb-4">
            L'applicazione sta impiegando più tempo del previsto per caricare.
          </p>
          
          {healthCheck && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
              <h3 className="font-semibold mb-2">Stato Servizi:</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Supabase:</span>
                  <span className={healthCheck.supabase ? 'text-green-600' : 'text-red-600'}>
                    {healthCheck.supabase ? '✓ OK' : '✗ Errore'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Database:</span>
                  <span className={healthCheck.database ? 'text-green-600' : 'text-red-600'}>
                    {healthCheck.database ? '✓ OK' : '✗ Errore'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Autenticazione:</span>
                  <span className={healthCheck.auth ? 'text-green-600' : 'text-red-600'}>
                    {healthCheck.auth ? '✓ OK' : '✗ Errore'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Button onClick={() => window.location.reload()} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Ricarica Pagina
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowTimeout(false)} 
              className="w-full"
            >
              Continua ad Aspettare
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="relative mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-red-600 rounded-full opacity-20 animate-pulse"></div>
          </div>
        </div>
        <p className="text-gray-600 text-lg mb-2">{message}{dots}</p>
        <p className="text-gray-400 text-sm mt-2">
          Inizializzazione in corso... Se il problema persiste, ricarica la pagina
        </p>
        <div className="mt-4">
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="text-sm"
          >
            Ricarica Ora
          </Button>
        </div>
      </div>
    </div>
  );
};