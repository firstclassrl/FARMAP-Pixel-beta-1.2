import {
  Users,
  ShoppingCart,
  Package,
  FileText,
  ArrowRight,
  BarChart3,
  Sprout,
  Building2,
  Calendar,
  FlaskConical
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { useAuth } from '../hooks/useAuth';
import { DailyAppointments } from '../components/DailyAppointments';

// Quick action sections with role-based filtering
const quickActions = [
  {
    title: 'Clienti',
    description: 'Gestisci i tuoi clienti e le loro informazioni',
    icon: Users,
    href: '/customers',
    color: 'bg-blue-500',
    hoverColor: 'hover:bg-blue-600',
    borderHover: 'hover:border-blue-500',
    textHover: 'group-hover:text-blue-600',
    roles: ['admin', 'commerciale', 'sales']
  },
  {
    title: 'Fatture',
    description: 'Crea e gestisci le fatture clienti',
    icon: FileText,
    href: '/invoices',
    color: 'bg-slate-700',
    hoverColor: 'hover:bg-slate-800',
    borderHover: 'hover:border-slate-600',
    textHover: 'group-hover:text-slate-700',
    roles: ['admin', 'commerciale', 'amministrazione']
  },
  {
    title: 'Prodotti',
    description: 'Gestisci il catalogo prodotti e il magazzino',
    icon: Package,
    href: '/products',
    color: 'bg-green-500',
    hoverColor: 'hover:bg-green-600',
    borderHover: 'hover:border-green-500',
    textHover: 'group-hover:text-green-600',
    roles: ['admin', 'commerciale', 'lettore', 'sales']
  },
  {
    title: 'Listini',
    description: 'Crea e gestisci i listini personalizzati',
    icon: FileText,
    href: '/price-lists',
    color: 'bg-purple-500',
    hoverColor: 'hover:bg-purple-600',
    borderHover: 'hover:border-purple-500',
    textHover: 'group-hover:text-purple-600',
    roles: ['admin', 'commerciale', 'sales']
  },
  {
    title: 'Ordini',
    description: 'Gestisci gli ordini e trasforma i listini',
    icon: ShoppingCart,
    href: '/orders',
    color: 'bg-orange-500',
    hoverColor: 'hover:bg-orange-600',
    borderHover: 'hover:border-orange-500',
    textHover: 'group-hover:text-orange-600',
    roles: ['admin', 'commerciale', 'sales']
  },
  {
    title: 'Calendario',
    description: 'Gestisci appuntamenti, chiamate e promemoria',
    icon: Calendar,
    href: '/calendar',
    color: 'bg-yellow-500',
    hoverColor: 'hover:bg-yellow-600',
    borderHover: 'hover:border-yellow-500',
    textHover: 'group-hover:text-yellow-600',
    roles: ['admin', 'commerciale', 'sales']
  },
  {
    title: 'Garden',
    description: 'Visualizza schede prodotto per ruolo specifico',
    icon: Sprout,
    href: '/garden',
    color: 'bg-emerald-500',
    hoverColor: 'hover:bg-emerald-600',
    borderHover: 'hover:border-emerald-500',
    textHover: 'group-hover:text-emerald-600',
    roles: ['admin', 'commerciale', 'production', 'sales']
  },
  {
    title: 'Campionatura',
    description: 'Gestisci le richieste di campioni dei clienti',
    icon: Building2,
    href: '/sample-requests',
    color: 'bg-red-500',
    hoverColor: 'hover:bg-red-600',
    borderHover: 'hover:border-red-500',
    textHover: 'group-hover:text-red-600',
    roles: ['admin', 'commerciale', 'sales']
  },
  {
    title: 'LAB',
    description: 'Gestisci materie prime, ricette e campionature',
    icon: FlaskConical,
    href: '/lab',
    color: 'bg-pink-500',
    hoverColor: 'hover:bg-pink-600',
    borderHover: 'hover:border-pink-500',
    textHover: 'group-hover:text-pink-600',
    roles: ['admin', 'lab']
  },
  {
    title: 'Report',
    description: 'Analizza le performance e monitora i KPI',
    icon: BarChart3,
    href: '/reports',
    color: 'bg-indigo-500',
    hoverColor: 'hover:bg-indigo-600',
    borderHover: 'hover:border-indigo-500',
    textHover: 'group-hover:text-indigo-600',
    roles: ['admin', 'commerciale', 'lettore', 'sales', 'lab']
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
          <h1 className="text-3xl font-bold text-gray-900">
            Buongiorno{profile?.full_name ? `, ${profile.full_name}` : ''}!
          </h1>
        </div>
      </div>

      {/* Daily Appointments */}
      <DailyAppointments />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <Card className={`h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer border-2 border-gray-200 ${action.borderHover}`}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`w-12 h-12 ${action.color} ${action.hoverColor} rounded-lg flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-lg font-bold text-gray-900 ${action.textHover} transition-colors duration-300`}>
                        {action.title}
                      </h3>
                    </div>
                    <ArrowRight className={`w-4 h-4 text-gray-400 ${action.textHover} group-hover:translate-x-1 transition-all duration-300`} />
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
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