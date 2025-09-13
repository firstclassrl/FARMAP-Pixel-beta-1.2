import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  ShoppingCart,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Sprout,
  UserCog,
  Loader2,
  Building2,
  User
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { useUI } from '../../store/useStore';
import { Button } from '../ui/button';
import { AuthStatus } from '../auth/AuthStatus';
import { useAuth } from '../../hooks/useAuth';

// Definiamo la lista completa di tutte le possibili voci del menu
const allNavigationItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['admin', 'sales', 'lettore'] },
  { name: 'Clienti', href: '/customers', icon: Users, roles: ['admin', 'sales'] },
  { name: 'Prodotti', href: '/products', icon: Package, roles: ['admin', 'sales', 'lettore'] },
  { name: 'Listini', href: '/price-lists', icon: FileText, roles: ['admin', 'sales'] },
  { name: 'Ordini', href: '/orders', icon: ShoppingCart, roles: ['admin', 'sales'] },
  { 
    name: 'Garden',
    href: '/garden',
    icon: Sprout,
    roles: ['admin', 'sales', 'production'],
    isSpecial: true // Proprietà per gestire lo stile speciale
  },
  { name: 'Campionatura', href: '/sample-requests', icon: Building2, roles: ['admin', 'sales'] },
  { name: 'Report', href: '/reports', icon: BarChart3, roles: ['admin', 'sales', 'lettore'] },
  { name: 'Gestione Utenti', href: '/user-management', icon: UserCog, roles: ['admin'] }
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
            <div className="flex items-center space-x-3 flex-1">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg leading-tight">Pixel CRM</h2>
                <p className="text-neutral-400 text-xs leading-tight">FARMAP</p>
              </div>
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
                
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 group",
                        sidebarCollapsed ? "justify-center" : "",
                        item.isSpecial && (isActive ? "bg-green-600 text-white" : "text-neutral-300 hover:bg-green-700/50 hover:text-white"),
                        !item.isSpecial && (isActive ? "bg-neutral-700 text-white" : "text-neutral-400 hover:bg-neutral-800 hover:text-white")
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
        
        {/* Footer con stato utente */}
        <div className="border-t border-neutral-800 p-4">
          {sidebarCollapsed ? (
            <div className="flex justify-center">
              <User className="w-5 h-5 text-neutral-400" />
            </div>
          ) : (
            <AuthStatus />
          )}
        </div>
      </div>
    </div>
  );
};