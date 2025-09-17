import { useState, useEffect } from 'react';
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
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../store/useStore';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export const UserProfile = () => {
  const { user, signOut } = useAuth();
  const { addNotification } = useNotifications();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        throw error;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      
      if (error) {
        addNotification({
          type: 'error',
          title: 'Errore',
          message: 'Impossibile effettuare il logout'
        });
      } else {
        addNotification({
          type: 'success',
          title: 'Logout effettuato',
          message: 'Sei stato disconnesso con successo'
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Amministratore',
      commerciale: 'Commerciale',
      lettore: 'Lettore'
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'text-red-600',
      commerciale: 'text-blue-600',
      lettore: 'text-gray-600'
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
        
        <DropdownMenuItem>
          <Settings className="w-4 h-4 mr-2" />
          Impostazioni
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
export default UserProfile;