import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Eye, 
  EyeOff, 
  Loader2, 
  Mail, 
  Lock,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../store/useStore';

const loginSchema = z.object({
  email: z.string().email('Email non valida').min(1, 'Email richiesta'),
  password: z.string().min(6, 'Password deve essere almeno 6 caratteri'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const { addNotification } = useNotifications();

  const from = location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    
    try {
      const { data: authData, error } = await signIn(data.email, data.password);

      if (error) {
        // Handle specific Supabase auth errors
        if (error.message.includes('Invalid login credentials')) {
          setError('email', { message: 'Email o password non corretti' });
          setError('password', { message: 'Email o password non corretti' });
        } else if (error.message.includes('Email not confirmed')) {
          addNotification({
            type: 'warning',
            title: 'Email non confermata',
            message: 'Controlla la tua email per confermare l\'account'
          });
        } else if (error.message.includes('Too many requests')) {
          addNotification({
            type: 'error',
            title: 'Troppi tentativi',
            message: 'Troppi tentativi di login. Riprova tra qualche minuto'
          });
        } else {
          addNotification({
            type: 'error',
            title: 'Errore di accesso',
            message: error.message || 'Si è verificato un errore durante l\'accesso'
          });
        }
        return;
      }

      if (authData.user) {
        addNotification({
          type: 'success',
          title: 'Accesso effettuato',
          message: 'Accesso effettuato con successo!'
        });
        
        // Redirect to intended page or dashboard
        navigate(from, { replace: true });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      addNotification({
        type: 'error',
        title: 'Errore di sistema',
        message: 'Si è verificato un errore imprevisto. Riprova più tardi.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen liquid-glass-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              src="/logo farmap industry.png" 
              alt="FARMAP Logo" 
              className="h-16 w-auto drop-shadow-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'text-3xl font-bold text-white';
                fallback.textContent = 'FARMAP';
                e.currentTarget.parentNode?.appendChild(fallback);
              }}
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            Accedi a Pixel CRM
          </h1>
          <p className="text-gray-200">
            Gestione commerciale FARMAP
          </p>
        </div>

        {/* Login Form */}
        <Card className="glass-morphism-card shadow-2xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center text-white">
              Accesso
            </CardTitle>
            <CardDescription className="text-center text-gray-200">
              Inserisci le tue credenziali per accedere al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nome@farmap.com"
                    autoComplete="email"
                    {...register('email')}
                    className={`pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-300 focus:bg-white/20 focus:border-white/40 ${errors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <div className="flex items-center space-x-1 text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <p className="text-sm">{errors.email.message}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...register('password')}
                    className={`pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-gray-300 focus:bg-white/20 focus:border-white/40 ${errors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : ''}`}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-white/10 text-gray-300 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <div className="flex items-center space-x-1 text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <p className="text-sm">{errors.password.message}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    id="remember"
                    type="checkbox"
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-white/30 bg-white/10 rounded"
                  />
                  <Label htmlFor="remember" className="text-sm text-white">
                    Ricordami
                  </Label>
                </div>
                <Link
                  to="/auth/forgot-password"
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  Password dimenticata?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Accesso in corso...
                  </>
                ) : (
                  'Accedi'
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
              className="h-5 w-auto filter brightness-110"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="text-sm text-gray-300">Pixel CRM v1.1.0 Beta</span>
          </div>
          <p className="text-xs text-gray-400">
            © 2025 FARMAP INDUSTRY S.r.l. Tutti i diritti riservati.
          </p>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
