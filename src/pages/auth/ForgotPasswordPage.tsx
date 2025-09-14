import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { 
  Loader2, 
  Mail, 
  AlertCircle,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../store/useStore';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email non valida').min(1, 'Email richiesta'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();
  const { addNotification } = useNotifications();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    
    try {
      const { error } = await resetPassword(data.email);

      if (error) {
        addNotification({
          type: 'error',
          title: 'Errore',
          message: error.message || 'Si è verificato un errore durante l\'invio dell\'email'
        });
        return;
      }

      setEmailSent(true);
      addNotification({
        type: 'success',
        title: 'Email inviata',
        message: 'Controlla la tua email per le istruzioni di reset della password'
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

  const handleResendEmail = async () => {
    const email = getValues('email');
    if (!email) return;

    setIsLoading(true);
    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        addNotification({
          type: 'error',
          title: 'Errore',
          message: 'Impossibile inviare nuovamente l\'email'
        });
      } else {
        addNotification({
          type: 'success',
          title: 'Email inviata',
          message: 'Email di reset inviata nuovamente'
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Si è verificato un errore'
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
            Password Dimenticata
          </h1>
          <p className="text-gray-600">
            Inserisci la tua email per ricevere le istruzioni di reset
          </p>
        </div>

        {/* Reset Form */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center">
              Reset Password
            </CardTitle>
            <CardDescription className="text-center">
              {emailSent 
                ? 'Email inviata! Controlla la tua casella di posta'
                : 'Ti invieremo un link per reimpostare la password'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailSent ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2 text-green-600 mb-4">
                  <CheckCircle className="w-6 h-6" />
                  <span className="font-medium">Email inviata con successo!</span>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 mb-2">
                    Abbiamo inviato le istruzioni per il reset della password a:
                  </p>
                  <p className="font-medium text-green-900">{getValues('email')}</p>
                </div>

                <div className="text-center space-y-3">
                  <p className="text-sm text-gray-600">
                    Non hai ricevuto l'email? Controlla la cartella spam o
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResendEmail}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Invio in corso...
                      </>
                    ) : (
                      'Invia nuovamente'
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

                <Button
                  type="submit"
                  className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-medium transition-all duration-200 hover:shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Invio email...
                    </>
                  ) : (
                    'Invia Email di Reset'
                  )}
                </Button>
              </form>
            )}

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <Link
                to="/auth/login"
                className="inline-flex items-center space-x-2 text-sm text-red-600 hover:text-red-700 font-medium hover:underline transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Torna al login</span>
              </Link>
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
export default ForgotPasswordPage;