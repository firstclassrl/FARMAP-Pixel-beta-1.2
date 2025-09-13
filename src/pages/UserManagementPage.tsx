import { useState, useEffect } from 'react';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Users, 
  UserPlus, 
  Loader2, 
  Eye, 
  EyeOff,
  Shield,
  Mail,
  User,
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../store/useStore';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

const createUserSchema = z.object({
  email: z.string().email('Email non valida').min(1, 'Email richiesta'),
  password: z.string().min(6, 'Password deve essere almeno 6 caratteri'),
  full_name: z.string().min(2, 'Nome completo richiesto'),
  role: z.enum(['admin', 'commerciale', 'lettore'], {
    required_error: 'Ruolo richiesto'
  })
});

type CreateUserForm = z.infer<typeof createUserSchema>;

const roleLabels = {
  admin: 'Amministratore',
  commerciale: 'Commerciale',
  lettore: 'Lettore'
};

const roleDescriptions = {
  admin: 'Accesso completo a tutte le funzionalità',
  commerciale: 'Gestione clienti, ordini e preventivi',
  lettore: 'Solo visualizzazione dati'
};

const getRoleBadge = (role: string) => {
  const styles = {
    admin: 'bg-red-100 text-red-800 border-red-200',
    commerciale: 'bg-blue-100 text-blue-800 border-blue-200',
    lettore: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[role as keyof typeof styles]}`}>
      {roleLabels[role as keyof typeof roleLabels] || role}
    </span>
  );
};

export const UserManagementPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { addNotification } = useNotifications();
  const { user: currentUser, signOut } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema)
  });

  const selectedRole = watch('role');

  const editUserSchema = z.object({
    full_name: z.string().min(2, 'Nome completo richiesto'),
    role: z.enum(['admin', 'commerciale', 'lettore'], {
      required_error: 'Ruolo richiesto'
    })
  });

  type EditUserForm = z.infer<typeof editUserSchema>;

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    formState: { errors: editErrors },
    reset: resetEdit,
    setValue: setEditValue,
  } = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema)
  });

  const loadUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Impossibile caricare la lista utenti'
      });
    } finally {
      setLoadingUsers(false);
    }
  }, [addNotification]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const onSubmit = async (data: CreateUserForm) => {
    setIsLoading(true);
    
    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        addNotification({
          type: 'error',
          title: 'Errore di sessione',
          message: 'Problema con la sessione utente. Riprova ad accedere.'
        });
        return;
      }

      if (!session?.access_token) {
        addNotification({
          type: 'error',
          title: 'Sessione scaduta',
          message: 'La tua sessione è scaduta. Effettua nuovamente l\'accesso.'
        });
        await signOut();
        return;
      }

      // Verify current user is admin before proceeding
      const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profileError || !currentProfile || currentProfile.role !== 'admin') {
        addNotification({
          type: 'error',
          title: 'Permessi insufficienti',
          message: 'Solo gli amministratori possono creare nuovi utenti'
        });
        return;
      }

      // Call the edge function to create user
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`;
      
      console.log('Calling Edge Function:', functionUrl);
      console.log('Request data:', { ...data, password: '[HIDDEN]' });
      
      const response = await fetch(
        functionUrl,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'x-client-info': 'pixel-crm@1.0.0'
          },
          body: JSON.stringify(data),
        }
      );

      console.log('Response status:', response.status);
      
      const result = await response.json();
      console.log('Response data:', result);

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}: Errore durante la creazione dell'utente`);
      }

      addNotification({
        type: 'success',
        title: 'Utente creato',
        message: `L'utente ${data.email} è stato creato con successo`
      });

      // Reset form and reload users
      reset();
      await loadUsers();

    } catch (error: any) {
      console.error('Error creating user:', error);
      addNotification({
        type: 'error',
        title: 'Errore creazione utente',
        message: error.message || 'Si è verificato un errore durante la creazione dell\'utente'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = (user: Profile) => {
    setEditingUser(user);
    resetEdit({
      full_name: user.full_name || '',
      role: user.role
    });
    setShowEditDialog(true);
  };

  const onSubmitEdit = async (data: EditUserForm) => {
    if (!editingUser || !currentUser?.id) return;

    // Prevent admin from changing their own role
    if (editingUser.id === currentUser.id && data.role !== editingUser.role) {
      addNotification({
        type: 'error',
        title: 'Operazione non consentita',
        message: 'Non puoi modificare il tuo stesso ruolo'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          role: data.role
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      addNotification({
        type: 'success',
        title: 'Utente aggiornato',
        message: `${data.full_name} è stato aggiornato con successo`
      });

      setShowEditDialog(false);
      setEditingUser(null);
      resetEdit();
      await loadUsers();

    } catch (error: any) {
      console.error('Error updating user:', error);
      addNotification({
        type: 'error',
        title: 'Errore aggiornamento',
        message: error.message || 'Si è verificato un errore durante l\'aggiornamento dell\'utente'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = (user: Profile) => {
    if (user.id === currentUser?.id) {
      addNotification({
        type: 'error',
        title: 'Operazione non consentita',
        message: 'Non puoi eliminare il tuo stesso account'
      });
      return;
    }
    setUserToDelete(user);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete || !currentUser?.id) return;

    setIsLoading(true);
    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        addNotification({
          type: 'error',
          title: 'Errore di sessione',
          message: 'Problema con la sessione utente. Riprova ad accedere.'
        });
        return;
      }

      if (!session?.access_token) {
        addNotification({
          type: 'error',
          title: 'Sessione scaduta',
          message: 'La tua sessione è scaduta. Effettua nuovamente l\'accesso.'
        });
        await signOut();
        return;
      }

      // Call the edge function to delete user
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`;
      
      const response = await fetch(
        functionUrl,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'x-client-info': 'pixel-crm@1.0.0'
          },
          body: JSON.stringify({ userId: userToDelete.id }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}: Errore durante l'eliminazione dell'utente`);
      }

      addNotification({
        type: 'success',
        title: 'Utente eliminato',
        message: `${userToDelete.full_name || userToDelete.email} è stato eliminato con successo`
      });

      setUserToDelete(null);
      await loadUsers();

    } catch (error: any) {
      console.error('Error deleting user:', error);
      addNotification({
        type: 'error',
        title: 'Errore eliminazione',
        message: error.message || 'Si è verificato un errore durante l\'eliminazione dell\'utente'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestione Utenti</h1>
          <p className="text-gray-600 mt-1">
            Crea e gestisci gli utenti del sistema
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={loadUsers} disabled={loadingUsers}>
            <Users className="w-4 h-4 mr-2" />
            Aggiorna Lista
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create User Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserPlus className="w-5 h-5" />
              <span>Nuovo Utente</span>
            </CardTitle>
            <CardDescription>
              Crea un nuovo utente con ruolo specifico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="utente@farmap.com"
                  {...register('email')}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder="Mario Rossi"
                  {...register('full_name')}
                  className={errors.full_name ? 'border-red-500' : ''}
                />
                {errors.full_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password')}
                    className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="role">Ruolo</Label>
                <Select onValueChange={(value) => setValue('role', value as any)}>
                  <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Seleziona un ruolo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex flex-col">
                        <span className="font-medium">Amministratore</span>
                        <span className="text-xs text-gray-500">Accesso completo</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="commerciale">
                      <div className="flex flex-col">
                        <span className="font-medium">Commerciale</span>
                        <span className="text-xs text-gray-500">Gestione vendite</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="lettore">
                      <div className="flex flex-col">
                        <span className="font-medium">Lettore</span>
                        <span className="text-xs text-gray-500">Solo lettura</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                )}
                {selectedRole && (
                  <p className="mt-1 text-xs text-gray-500">
                    {roleDescriptions[selectedRole]}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creazione in corso...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Crea Utente
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Utenti Esistenti</span>
            </CardTitle>
            <CardDescription>
              Lista di tutti gli utenti registrati nel sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Caricamento utenti...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nessun utente trovato</p>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((userProfile) => (
                  <div
                    key={userProfile.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900">
                            {userProfile.full_name || 'Nome non specificato'}
                          </p>
                          {getRoleBadge(userProfile.role)}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Mail className="w-3 h-3" />
                            <span>{userProfile.email}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {new Date(userProfile.created_at).toLocaleDateString('it-IT')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditUser(userProfile)}
                        title="Modifica utente"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUser(userProfile)}
                        title="Elimina utente"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={userProfile.id === currentUser?.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Utente</DialogTitle>
            <DialogDescription>
              Modifica le informazioni dell'utente selezionato
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="space-y-4">
            <div>
              <Label htmlFor="edit_full_name">Nome Completo</Label>
              <Input
                id="edit_full_name"
                {...registerEdit('full_name')}
                className={editErrors.full_name ? 'border-red-500' : ''}
              />
              {editErrors.full_name && (
                <p className="mt-1 text-sm text-red-600">{editErrors.full_name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="edit_role">Ruolo</Label>
              <Select 
                value={watch('role')} 
                onValueChange={(value) => setEditValue('role', value as any)}
                disabled={editingUser?.id === currentUser?.id}
              >
                <SelectTrigger className={editErrors.role ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Seleziona un ruolo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex flex-col">
                      <span className="font-medium">Amministratore</span>
                      <span className="text-xs text-gray-500">Accesso completo</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="commerciale">
                    <div className="flex flex-col">
                      <span className="font-medium">Commerciale</span>
                      <span className="text-xs text-gray-500">Gestione vendite</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="lettore">
                    <div className="flex flex-col">
                      <span className="font-medium">Lettore</span>
                      <span className="text-xs text-gray-500">Solo lettura</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {editErrors.role && (
                <p className="mt-1 text-sm text-red-600">{editErrors.role.message}</p>
              )}
              {editingUser?.id === currentUser?.id && (
                <p className="mt-1 text-xs text-gray-500">
                  Non puoi modificare il tuo stesso ruolo
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowEditDialog(false)}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Aggiornamento...
                  </>
                ) : (
                  'Salva Modifiche'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span>Conferma Eliminazione</span>
            </DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare l'utente "{userToDelete?.full_name || userToDelete?.email}"?
              <br />
              <span className="text-red-600 font-medium">
                Questa azione eliminerà permanentemente l'account e tutti i dati associati.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserToDelete(null)}>
              Annulla
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteUser}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminazione...
                </>
              ) : (
                'Sì, elimina utente'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default UserManagementPage;