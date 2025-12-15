import { useEffect, useState } from 'react';
import { User, LogOut, Settings, Shield, UserCog } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../store/useStore';
import { supabase } from '../../lib/supabase';

export const UserProfile = () => {
  const { user, profile, signOut } = useAuth();
  const { addNotification } = useNotifications();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [invoicesEnabled, setInvoicesEnabled] = useState(false);
  const isAdmin = profile?.role === 'admin';

  const handleSignOut = async () => {
    try {
      await signOut();
      addNotification({
        type: 'success',
        title: 'Logout effettuato',
        message: 'Sei stato disconnesso con successo'
      });
    } catch (error) {
      console.error('Logout error:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Impossibile effettuare il logout'
      });
    }
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Amministratore',
      commerciale: 'Commerciale',
      lettore: 'Lettore',
      production: 'Produzione',
      sales: 'Vendite',
      customer_user: 'Cliente',
      lab: 'Laboratorio'
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'text-red-600',
      commerciale: 'text-blue-600',
      lettore: 'text-gray-600',
      production: 'text-orange-600',
      sales: 'text-teal-600',
      customer_user: 'text-yellow-600',
      lab: 'text-pink-600'
    };
    return colors[role as keyof typeof colors] || 'text-gray-600';
  };

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  const getAvatarColor = (email: string) => {
    // Generate a consistent color based on email
    const colors = [
      'bg-red-500',
      'bg-blue-500', 
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500'
    ];
    const index = email.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Carica il flag invoices_enabled quando l'admin apre le impostazioni
  useEffect(() => {
    const loadSettings = async () => {
      if (!settingsOpen || !isAdmin) return;
      setLoadingSettings(true);
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'invoices_enabled')
        .maybeSingle();

      if (error) {
        console.error('Errore caricamento impostazioni fatturazione:', error);
        addNotification({
          type: 'error',
          title: 'Errore impostazioni',
          message: 'Impossibile caricare lo stato del modulo fatturazione.'
        });
      } else {
        setInvoicesEnabled(Boolean((data as any)?.value?.enabled));
      }
      setLoadingSettings(false);
    };

    loadSettings();
  }, [settingsOpen, isAdmin, addNotification]);

  const handleToggleInvoices = async (enabled: boolean) => {
    setInvoicesEnabled(enabled);

    const { error } = await supabase
      .from('app_settings')
      .upsert(
        { key: 'invoices_enabled', value: { enabled } },
        { onConflict: 'key' }
      );

    if (error) {
      console.error('Errore aggiornamento impostazioni fatturazione:', error);
      addNotification({
        type: 'error',
        title: 'Errore impostazioni',
        message: 'Impossibile aggiornare il modulo fatturazione.'
      });
      // rollback visuale
      setInvoicesEnabled(!enabled);
    } else {
      addNotification({
        type: 'success',
        title: 'Impostazioni salvate',
        message: enabled
          ? 'Modulo fatturazione attivato.'
          : 'Modulo fatturazione disattivato.'
      });
    }
  };
  if (!user) {
    return (
      <Button variant="outline" asChild>
        <Link to="/auth/login">
          <User className="w-4 h-4 mr-2" />
          Accedi
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost"
          className={`h-10 w-10 rounded-full ${getAvatarColor(user.email)} hover:opacity-80 text-white font-semibold text-lg transition-all duration-200 hover:scale-105 shadow-md`}
        >
          {getInitials(user.email)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-3 py-2">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${getAvatarColor(user.email)} rounded-full flex items-center justify-center text-white font-semibold`}>
              {getInitials(user.email)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {profile?.full_name || user.email}
              </p>
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
              {profile?.role && (
                <div className="flex items-center space-x-1 mt-1">
                  <Shield className="w-3 h-3 text-gray-400" />
                  <span className={`text-xs font-medium ${getRoleColor(profile.role)}`}>
                    {getRoleLabel(profile.role)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Admin-only User Management */}
        {profile?.role === 'admin' && (
          <>
            <DropdownMenuItem asChild>
              <Link to="/user-management" className="flex items-center">
                <UserCog className="w-4 h-4 mr-2" />
                Gestione Utenti
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        <DropdownMenuItem
          onClick={() => {
            if (isAdmin) {
              setSettingsOpen(true);
            }
          }}
          className={isAdmin ? '' : 'opacity-50 cursor-not-allowed'}
        >
          <Settings className="w-4 h-4 mr-2" />
          Impostazioni
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>

      {/* Modale impostazioni applicazione (solo admin) */}
      {isAdmin && (
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Impostazioni applicazione</DialogTitle>
              <DialogDescription>
                Configura le funzioni avanzate disponibili per tutti gli utenti.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">Modulo fatturazione</p>
                  <p className="text-sm text-gray-500">
                    Quando attivo, il modulo di fatturazione è visibile per ruoli
                    <span className="font-semibold"> admin, commerciale, amministrazione</span>.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="checkbox"
                    checked={invoicesEnabled}
                    disabled={loadingSettings}
                    onChange={(e) => handleToggleInvoices(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">
                    {invoicesEnabled ? 'Attivo' : 'Disattivo'}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                Chiudi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DropdownMenu>
  );
};
export default UserProfile;