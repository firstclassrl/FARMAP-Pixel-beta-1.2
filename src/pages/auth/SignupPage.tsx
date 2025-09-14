import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Eye, 
  EyeOff, 
  Loader2, 
  Mail, 
  Lock,
  User,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../store/useStore';

const signupSchema = z.object({
  email: z.string().email('Email non valida').min(1, 'Email richiesta'),
  password: z.string().min(6, 'Password deve essere almeno 6 caratteri'),
  confirmPassword: z.string().min(6, 'Conferma password richiesta'),
  fullName: z.string().min(2, 'Nome completo richiesto'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Le password non corrispondono",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

export const SignupPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { addNotification } = useNotifications();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    
    try {
      const { data: authData, error } = await signUp(data.email, data.password);

      if (error) {
        // Handle specific Supabase auth errors
        if (error.message.includes('User already registered')) {
          setError('email', { message: 'Questo indirizzo email è già registrato' });
        } else if (error.message.includes('Password should be at least')) {
          setError('password', { message: 'Password troppo debole' });
        } else if (error.message.includes('Invalid email')) {
          setError('email', { message: 'Formato email non valido' });
        } else {
          addNotification({
            type: 'error',
            title: 'Errore di registrazione',
            message: error.message || 'Si è verificato un errore durante la registrazione'
          });
        }
        return;
      }

      if (authData.user) {
        addNotification({
          type: 'success',
          title: 'Registrazione completata',
          message: 'Account creato con successo! Puoi ora accedere al sistema.'
        });
        
        // Redirect to login page
        navigate('/auth/login', { 
          state: { 
            message: 'Registrazione completata! Effettua l\'accesso con le tue credenziali.' 
          }
        });
      }
    } catch (error: any) {
      console.error('Signup error:', error);
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
            Registrati a Pixel CRM
          </h1>
          <p className="text-gray-600">
            Crea il tuo account per iniziare
          </p>
        </div>

        {/* Signup Form */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center">
              Registrazione
            </CardTitle>
            <CardDescription className="text-center">
              Compila i campi per creare il tuo account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Mario Rossi"
                    {...register('fullName')}
                    className={`pl-10 ${errors.fullName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.fullName && (
                  <div className="flex items-center space-x-1 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <p className="text-sm">{errors.fullName.message}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nome@farmap.com"
                    {...register('email')}
                    className={`pl-10 ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <div className="flex items-center space-x-1 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <p className="text-sm">{errors.email.message}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
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
                <Label htmlFor="confirmPassword">Conferma Password</Label>
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

              <Button
                type="submit"
                className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-medium transition-all duration-200 hover:shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrazione in corso...
                  </>
                ) : (
                  'Crea Account'
                )}
              </Button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Hai già un account?{' '}
                <Link
                  to="/auth/login"
                  className="text-red-600 hover:text-red-700 font-medium hover:underline transition-colors"
                >
                  Accedi qui
                </Link>
              </p>
            </div>
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
export default SignupPage;