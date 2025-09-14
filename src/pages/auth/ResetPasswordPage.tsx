import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Eye, 
  EyeOff, 
  Loader2, 
  Lock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { supabase } from '../../lib/supabase';
import { useNotifications } from '../../store/useStore';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password deve essere almeno 6 caratteri'),
  confirmPassword: z.string().min(6, 'Conferma password richiesta'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Le password non corrispondono",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export const ResetPasswordPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addNotification } = useNotifications();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    // Check if we have valid reset tokens in the URL
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const type = searchParams.get('type');

    if (type === 'recovery' && accessToken && refreshToken) {
      // Set the session with the tokens from the URL
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ error }) => {
        if (error) {
          console.error('Error setting session:', error);
          addNotification({
            type: 'error',
            title: 'Link non valido',
            message: 'Il link di reset password non è valido o è scaduto'
          });
          navigate('/auth/forgot-password');
        } else {
          setIsValidToken(true);
        }
        setCheckingToken(false);
      });
    } else {
      setCheckingToken(false);
      addNotification({
        type: 'error',
        title: 'Link non valido',
        message: 'Il link di reset password non è valido o è scaduto'
      });
      navigate('/auth/forgot-password');
    }
  }, [searchParams, navigate, addNotification]);

  const onSubmit = async (data: ResetPasswordForm) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      });

      if (error) {
        addNotification({
          type: 'error',
          title: 'Errore',
          message: error.message || 'Si è verificato un errore durante l\'aggiornamento della password'
        });
        return;
      }

      addNotification({
        type: 'success',
        title: 'Password aggiornata',
        message: 'La tua password è stata aggiornata con successo'
      });
      
      // Redirect to login page
      navigate('/auth/login', { 
        state: { 
          message: 'Password aggiornata con successo! Effettua l\'accesso con la nuova password.' 
        }
      });
    } catch (error: any) {
      console.error('Reset password error:', error);
      addNotification({
        type: 'error',
        title: 'Errore di sistema',
        message: 'Si è verificato un errore imprevisto. Riprova più tardi.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifica del link in corso...</p>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return null; // Will redirect to forgot password page
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              src="/logo farmap industry.png" 
              alt="FARMAP Logo" 
              className="h-16 w-auto drop-shadow-sm"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'text-3xl font-bold text-red-600';
                fallback.textContent = 'FARMAP';
                e.currentTarget.parentNode?.appendChild(fallback);
              }}
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Nuova Password
          </h1>
          <p className="text-gray-600">
            Inserisci la tua nuova password
          </p>
        </div>

        {/* Reset Password Form */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center">
              Imposta Nuova Password
            </CardTitle>
            <CardDescription className="text-center">
              Scegli una password sicura per il tuo account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nuova Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password')}
                    className={`pl-10 pr-10 ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <div className="flex items-center space-x-1 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <p className="text-sm">{errors.password.message}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Conferma Nuova Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('confirmPassword')}
                    className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <div className="flex items-center space-x-1 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <p className="text-sm">{errors.confirmPassword.message}</p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-medium text-blue-800">Requisiti Password</p>
                </div>
                <ul className="text-xs text-blue-700 space-y-1 ml-6">
                  <li>• Almeno 6 caratteri</li>
                  <li>• Usa una combinazione di lettere e numeri</li>
                  <li>• Evita informazioni personali facilmente indovinabili</li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-medium transition-all duration-200 hover:shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Aggiornamento password...
                  </>
                ) : (
                  'Aggiorna Password'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <img 
              src="/Logo Pixel Farmap 2025.png" 
              alt="Pixel Logo" 
              className="h-5 w-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="text-sm text-gray-500">Pixel CRM v1.0.0</span>
          </div>
          <p className="text-xs text-gray-400">
            © 2025 FARMAP INDUSTRY S.r.l. Tutti i diritti riservati.
          </p>
        </div>
      </div>
    </div>
  );
};
export default ResetPasswordPage;