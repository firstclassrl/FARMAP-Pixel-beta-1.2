import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  ReceiptIndianRupee,
  ShoppingCart,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Sprout,
  UserCog,
  Loader2,
  Building2,
  Calendar,
  FlaskConical
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { useUI } from '../../store/useStore';
import { Button } from '../ui/button';
import { useAuth } from '../../hooks/useAuth';

// Definiamo la lista completa di tutte le possibili voci del menu con i colori specifici
const allNavigationItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['admin', 'sales', 'commerciale', 'amministrazione', 'lettore', 'warehouse'], color: 'neutral' },
  { name: 'Clienti', href: '/customers', icon: Users, roles: ['admin', 'sales', 'commerciale', 'amministrazione', 'lab'], color: 'blue' },
  { name: 'Prodotti', href: '/products', icon: Package, roles: ['admin', 'sales', 'commerciale', 'amministrazione', 'lettore', 'lab', 'warehouse'], color: 'green' },
  { name: 'Listini', href: '/price-lists', icon: FileText, roles: ['admin', 'sales', 'commerciale', 'amministrazione'], color: 'purple' },
  { name: 'Ordini', href: '/orders', icon: ShoppingCart, roles: ['admin', 'sales', 'commerciale', 'amministrazione'], color: 'orange' },
  { name: 'Fatture', href: '/invoices', icon: ReceiptIndianRupee, roles: ['admin', 'commerciale', 'amministrazione'], color: 'indigo' },
  { name: 'Calendario', href: '/calendar', icon: Calendar, roles: ['admin', 'sales', 'commerciale', 'amministrazione', 'lab'], color: 'yellow' },
  { 
    name: 'Garden',
    href: '/garden',
    icon: Sprout,
    roles: ['admin', 'sales', 'commerciale', 'production', 'lab'],
    color: 'emerald'
  },
  { name: 'LAB', href: '/lab', icon: FlaskConical, roles: ['admin', 'lab'], color: 'pink' },
  { name: 'Campionatura', href: '/sample-requests', icon: Building2, roles: ['admin', 'sales', 'commerciale'], color: 'red' },
  { name: 'Report', href: '/reports', icon: BarChart3, roles: ['admin', 'sales', 'commerciale', 'lettore'], color: 'blue' },
  { name: 'Gestione Utenti', href: '/user-management', icon: UserCog, roles: ['admin'], color: 'neutral' }
] as const;

export function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed, setSidebarCollapsed } = useUI();
  const { profile, loading } = useAuth(); // Prendiamo anche lo stato di 'loading'

  // Filtriamo i link solo quando il profilo è caricato
  const visibleNavigation = useMemo(() => {
    if (!profile?.role) return [];
    
    if (profile.role === 'production') {
      return allNavigationItems.filter(item => item.name === 'Garden');
    }
    
    const userRole = profile.role as string;
    return allNavigationItems.filter(item => item.roles.includes(userRole));
  }, [profile?.role]);

  return (
    <div className={cn(
      "bg-neutral-950 border-r border-neutral-800 transition-all duration-300 ease-in-out relative shadow-lg",
      sidebarCollapsed ? "w-20" : "w-64"
    )}>
      <div className="flex flex-col h-full">
        {/* Header con logo e pulsante */}
        <div className="flex items-center h-20 p-4 border-b border-neutral-800">
          {!sidebarCollapsed && (
            <div className="flex justify-center flex-1">
              <img src="/logo farmap industry.png" alt="FARMAP Logo" className="w-32 h-16 object-contain" />
            </div>
          )}
          {sidebarCollapsed && (
            <div className="flex justify-center">
              <img src="/logo farmap industry.png" alt="FARMAP Logo" className="w-16 h-12 object-contain" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn("text-neutral-400 hover:text-white hover:bg-neutral-800", !sidebarCollapsed && "ml-auto")}
          >
            {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </Button>
        </div>

        {/* Navigazione */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {/* LA CORREZIONE CHIAVE È QUI */}
          {loading ? (
            <div className="flex justify-center pt-8">
              <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
            </div>
          ) : (
            <ul className="space-y-2">
              {visibleNavigation.map((item) => {
                const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
                
                // Funzione per ottenere le classi CSS basate sul colore
                const getColorClasses = (color: string, isActive: boolean) => {
                  const colorMap = {
                    blue: isActive ? "bg-blue-600 text-white" : "text-neutral-400 hover:bg-blue-600/20 hover:text-blue-400",
                    green: isActive ? "bg-green-600 text-white" : "text-neutral-400 hover:bg-green-600/20 hover:text-green-400",
                    purple: isActive ? "bg-purple-600 text-white" : "text-neutral-400 hover:bg-purple-600/20 hover:text-purple-400",
                    orange: isActive ? "bg-orange-600 text-white" : "text-neutral-400 hover:bg-orange-600/20 hover:text-orange-400",
                    emerald: isActive ? "bg-emerald-600 text-white" : "text-neutral-400 hover:bg-emerald-600/20 hover:text-emerald-400",
                    red: isActive ? "bg-red-600 text-white" : "text-neutral-400 hover:bg-red-600/20 hover:text-red-400",
                    indigo: isActive ? "bg-indigo-600 text-white" : "text-neutral-400 hover:bg-indigo-600/20 hover:text-indigo-400",
                    yellow: isActive ? "bg-yellow-600 text-white" : "text-neutral-400 hover:bg-yellow-600/20 hover:text-yellow-400",
                    pink: isActive ? "bg-pink-600 text-white" : "text-neutral-400 hover:bg-pink-600/20 hover:text-pink-400",
                    neutral: isActive ? "bg-neutral-700 text-white" : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                  };
                  return colorMap[color as keyof typeof colorMap] || colorMap.neutral;
                };
                
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 group",
                        sidebarCollapsed ? "justify-center" : "",
                        getColorClasses(item.color, isActive)
                      )}
                      title={sidebarCollapsed ? item.name : undefined}
                    >
                      <item.icon className={cn("flex-shrink-0 w-5 h-5", !sidebarCollapsed && "mr-3")} />
                      {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>
        
        
        {/* Footer con logo Pixel */}
        <div className="border-t border-neutral-800 p-4">
          {sidebarCollapsed ? (
            <div className="flex justify-center">
              <img src="/Logo Pixel Farmap 2025.png" alt="Pixel Logo" className="h-5 w-auto filter brightness-110" />
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <img src="/Logo Pixel Farmap 2025.png" alt="Pixel Logo" className="h-5 w-auto filter brightness-110" />
              <span className="text-xs text-neutral-400">{`Pixel v ${__APP_VERSION__}`}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};