import {
  Users,
  ShoppingCart,
  Package,
  FileText,
  Building,
  ArrowRight,
  BarChart3,
  Sprout,
  Building2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/useAuth';

// Quick action sections with role-based filtering
const quickActions = [
  {
    title: 'Clienti',
    description: 'Gestisci i tuoi clienti e le loro informazioni',
    icon: Users,
    href: '/customers',
    color: 'bg-blue-500',
    hoverColor: 'hover:bg-blue-600',
    roles: ['admin', 'commerciale']
  },
  {
    title: 'Prodotti',
    description: 'Gestisci il catalogo prodotti e il magazzino',
    icon: Package,
    href: '/products',
    color: 'bg-green-500',
    hoverColor: 'hover:bg-green-600',
    roles: ['admin', 'commerciale', 'lettore']
  },
  {
    title: 'Listini',
    description: 'Crea e gestisci i listini personalizzati',
    icon: FileText,
    href: '/price-lists',
    color: 'bg-purple-500',
    hoverColor: 'hover:bg-purple-600',
    roles: ['admin', 'commerciale']
  },
  {
    title: 'Ordini',
    description: 'Gestisci gli ordini e trasforma i listini',
    icon: ShoppingCart,
    href: '/orders',
    color: 'bg-orange-500',
    hoverColor: 'hover:bg-orange-600',
    roles: ['admin', 'commerciale']
  },
  {
    title: 'Garden',
    description: 'Visualizza schede prodotto per ruolo specifico',
    icon: Sprout,
    href: '/garden',
    color: 'bg-emerald-500',
    hoverColor: 'hover:bg-emerald-600',
    roles: ['admin', 'commerciale', 'production']
  },
  {
    title: 'Campionatura',
    description: 'Gestisci le richieste di campioni dei clienti',
    icon: Building2,
    href: '/sample-requests',
    color: 'bg-red-500',
    hoverColor: 'hover:bg-red-600',
    roles: ['admin', 'commerciale']
  },
  {
    title: 'Report',
    description: 'Analizza le performance e monitora i KPI',
    icon: BarChart3,
    href: '/reports',
    color: 'bg-indigo-500',
    hoverColor: 'hover:bg-indigo-600',
    roles: ['admin', 'commerciale', 'lettore']
  }
];

export default function Dashboard() {
  const { profile, loading } = useAuth();

  // Filter actions based on user role
  const visibleActions = quickActions.filter(action => {
    if (!profile?.role) return false;
    return action.roles.includes(profile.role);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Benvenuto{profile?.full_name ? `, ${profile.full_name}` : ''}! Cosa vuoi fare oggi?
          </p>
          {profile?.role && (
            <p className="text-sm text-gray-500 mt-1">
              Ruolo: <span className="font-medium capitalize">{profile.role}</span>
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleActions.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna azione disponibile</h3>
              <p className="text-gray-600">
                Il tuo ruolo attuale non ha accesso a nessuna sezione del sistema.
                <br />
                Contatta l'amministratore per verificare i tuoi permessi.
              </p>
            </Card>
          </div>
        ) : (
          visibleActions.map((action, index) => (
          <Link key={index} to={action.href} className="group">
            <Card className="h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer border-2 hover:border-primary-200">
              <CardContent className="p-8">
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`w-16 h-16 ${action.color} ${action.hoverColor} rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110`}>
                    <action.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors duration-300">
                      {action.title}
                    </h3>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all duration-300" />
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {action.description}
                </p>
              </CardContent>
            </Card>
          </Link>
          ))
        )}
      </div>
    </div>
  );
};