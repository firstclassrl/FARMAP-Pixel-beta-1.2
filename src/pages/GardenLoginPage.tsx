import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2, Zap, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useNotifications } from '../store/useStore';

export const GardenLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Check user role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError) throw profileError;

        // Only allow production and customer_user roles
        if (profile.role === 'production' || profile.role === 'customer_user') {
          addNotification({
            type: 'success',
            title: 'Accesso riuscito',
            message: `Benvenuto in Garden!`
          });
          navigate('/garden');
        } else {
          await supabase.auth.signOut();
          addNotification({
            type: 'error',
            title: 'Accesso negato',
            message: 'Il tuo ruolo non ha accesso a Garden'
          });
        }
      }
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Errore di accesso',
        message: error.message || 'Credenziali non valide'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-emerald-900 to-teal-900 relative overflow-hidden flex items-center justify-center p-4">
      {/* Dark Pattern Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, #10b981 1px, transparent 1px),
            radial-gradient(circle at 75% 75%, #14b8a6 1px, transparent 1px),
            radial-gradient(circle at 50% 50%, #06b6d4 1px, transparent 1px),
            linear-gradient(45deg, transparent 40%, rgba(16, 185, 129, 0.1) 50%, transparent 60%),
            linear-gradient(-45deg, transparent 40%, rgba(20, 184, 166, 0.1) 50%, transparent 60%)
          `,
          backgroundSize: '80px 80px, 100px 100px, 60px 60px, 120px 120px, 120px 120px'
        }} />
      </div>

      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(16, 185, 129, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Floating Orbs - More Subtle */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-xl animate-pulse" />
      <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-full blur-xl animate-pulse delay-1000" />
      <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 rounded-full blur-xl animate-pulse delay-2000" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-6">
          <div className="mb-4 space-y-2">
            {/* Farmap Logo */}
            <div>
              <img 
                src="/logo farmap industry.png" 
                alt="FARMAP Industry Logo" 
                className="h-10 mx-auto object-contain"
              />
            </div>
            {/* Garden Logo */}
            <div>
              <img 
                src="/Logo Garden Farmap.png" 
                alt="Garden Farmap Logo" 
                className="h-14 mx-auto object-contain"
              />
            </div>
          </div>
        </div>

        {/* Login Card */}
        <Card className="bg-white/30 backdrop-blur-xl border border-white/40 shadow-2xl">
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-xl font-bold text-gray-800">
              Accedi a Garden
            </CardTitle>
            <p className="text-gray-600 text-xs">
              Solo per ruoli Produzione e Cliente
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div className="space-y-1">
                <Label htmlFor="email" className="text-gray-700 font-medium text-sm">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="inserisci@email.com"
                  required
                  className="h-10 bg-white/40 backdrop-blur-sm border-white/50 text-gray-800 placeholder:text-gray-600 focus:border-emerald-400/70 focus:ring-emerald-400/30"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <Label htmlFor="password" className="text-gray-700 font-medium text-sm">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="h-10 bg-white/40 backdrop-blur-sm border-white/50 text-gray-800 placeholder:text-gray-600 focus:border-emerald-400/70 focus:ring-emerald-400/30 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                </div>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 shadow-lg hover:shadow-emerald-500/25 transition-all duration-300"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Accesso in corso...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Accedi a Garden
                  </>
                )}
              </Button>
            </form>

            {/* Info */}
            <div className="mt-4 p-3 bg-blue-50/50 border border-blue-200/50 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-700">
                  <p className="font-medium mb-1">Accesso limitato</p>
                  <p>Questa piattaforma è riservata ai ruoli <strong>Produzione</strong> e <strong>Cliente</strong>.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            Powered by <span className="font-semibold text-emerald-600">Pixel CRM</span>
          </p>
        </div>
      </div>
    </div>
  );
};
