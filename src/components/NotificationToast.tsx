import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useNotifications } from '../store/useStore';

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  timestamp: Date;
}

const typeIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
};

const typeColors: Record<ToastNotification['type'], string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error:   'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info:    'bg-blue-50 border-blue-200 text-blue-800'
};

const typeIconColors: Record<ToastNotification['type'], string> = {
  success: 'text-green-600',
  error:   'text-red-600',
  warning: 'text-yellow-600',
  info:    'text-blue-600'
};

export const NotificationToast: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();
  const [currentToast, setCurrentToast] = useState<ToastNotification | null>(null);
  const timerRef = useRef<number | null>(null);

  // Prende SEMPRE la notifica più recente (prima in lista) e imposta l’auto-dismiss
  useEffect(() => {
    // Pulisce eventuale timer precedente
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Nessuna notifica → chiudi il toast
    if (!notifications || notifications.length === 0) {
      setCurrentToast(null);
      return;
    }

    // Mostra la più recente (assumiamo notifications[0] sia l’ultima pushata)
    const latest = notifications[0] as ToastNotification;
    setCurrentToast(latest);

    // Auto-rimozione dopo 3s
    timerRef.current = window.setTimeout(() => {
      removeNotification(latest.id); // rimuove dallo stato globale
      setCurrentToast(null);         // chiude il toast locale
      timerRef.current = null;
    }, 3000);

    // Cleanup quando cambia la lista o si smonta il componente
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [notifications, removeNotification]);

  const handleDismiss = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (currentToast) {
      removeNotification(currentToast.id);
    }
    setCurrentToast(null);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
      <AnimatePresence>
        {currentToast && (
          <motion.div
            key={currentToast.id}
            initial={{ opacity: 0, x: 300, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className={`pointer-events-auto max-w-sm w-full border rounded-lg shadow-lg p-4 ${typeColors[currentToast.type]}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {React.createElement(typeIcons[currentToast.type], {
                  className: `w-5 h-5 ${typeIconColors[currentToast.type]}`
                })}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{currentToast.title}</p>
                {currentToast.message && (
                  <p className="text-sm mt-1 opacity-90">{currentToast.message}</p>
                )}
              </div>

              <button
                onClick={handleDismiss}
                className="flex-shrink-0 ml-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Chiudi notifica"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
