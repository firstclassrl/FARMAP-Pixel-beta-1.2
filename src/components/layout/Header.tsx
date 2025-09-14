import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  Settings,
  Menu,
  Plus,
  Download,
  Upload,
  Eye,
  Trash2,
  CheckCircle,
  User
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { UserProfile } from '../auth/UserProfile';
import { useSearch, useNotifications } from '../../store/useStore';
import { cn } from '../../lib/cn';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { typeIcons, typeColors } from '../../pages/NotificationsPage';
import { useAuth } from '../../hooks/useAuth';
import { useSmartSearch } from '../../hooks/useSmartSearch';
import { SearchResults } from '../SearchResults';

export const Header = () => {
  const { globalSearchTerm, setGlobalSearchTerm, addToSearchHistory } = useSearch();
  const { 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    clearNotifications,
    removeNotification 
  } = useNotifications();
  const [searchFocused, setSearchFocused] = useState(false);
  const { profile, loading } = useAuth();
  const searchRef = useRef<HTMLDivElement>(null);
  
  const {
    searchResults,
    isSearching,
    searchTerm,
    handleSearch,
    handleResultClick,
    clearSearch
  } = useSmartSearch();

  const unreadCount = notifications.filter(n => !n.read).length;
  const recentNotifications = notifications.slice(0, 5); // Show only 5 most recent

  // Handle search input changes
  const handleSearchInput = (value: string) => {
    setGlobalSearchTerm(value);
    handleSearch(value);
  };

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearchTerm.trim()) {
      addToSearchHistory(globalSearchTerm);
      // Search is already triggered by handleSearchInput
    }
  };

  // Handle result click
  const handleSearchResultClick = (result: any) => {
    addToSearchHistory(globalSearchTerm);
    handleResultClick(result);
    setGlobalSearchTerm('');
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        clearSearch();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [clearSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Global shortcuts
    if (e.key === '/' && !searchFocused) {
      e.preventDefault();
      document.getElementById('global-search')?.focus();
    }
    
    if (e.key === 'n' && e.ctrlKey) {
      e.preventDefault();
      // Implement "new" shortcut logic
    }
  };

  const handleMarkAsRead = (id: string) => {
    markNotificationAsRead(id);
  };

  const handleDeleteNotification = (id: string) => {
    removeNotification(id);
  };

  return (
    <header 
      className="bg-background border-b border-border px-8 py-4 shadow-sm"
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-xl" ref={searchRef}>
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="global-search"
              type="text"
              placeholder="🤖 Cerca qualsiasi cosa in Pixel... (premi '/' per cercare)"
              value={globalSearchTerm}
              onChange={(e) => handleSearchInput(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="pl-10 pr-4 w-full h-10 rounded-xl shadow-sm bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary-500 focus:ring-primary-500 transition-all duration-200"
            />
            
            {/* Search Results */}
            <SearchResults
              results={searchResults}
              isSearching={isSearching}
              onResultClick={handleSearchResultClick}
              onClear={clearSearch}
              searchTerm={searchTerm}
            />
          </form>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {/* User Role Badge */}
          {profile?.role && !loading && (
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full">
              <User className="w-3 h-3 text-gray-500" />
              <span className="text-xs font-medium text-gray-700 capitalize">
                {profile.role}
              </span>
            </div>
          )}

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-10 w-10 rounded-xl hover:bg-accent hover:text-accent-foreground transition-all duration-200"
                title="Notifiche"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-lg animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-3 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Notifiche</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs text-gray-500">{unreadCount} non lette</span>
                  )}
                </div>
              </div>
              
              {recentNotifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Nessuna notifica</p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {recentNotifications.map((notification) => {
                    const Icon = typeIcons[notification.type];
                    
                    return (
                      <div
                        key={notification.id}
                        className={`p-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${typeColors[notification.type]}`}>
                            <Icon className="w-3 h-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className={`text-sm font-medium truncate ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                              )}
                            </div>
                            {notification.message && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDistanceToNow(notification.timestamp, { 
                                addSuffix: true, 
                                locale: it 
                              })}
                            </p>
                          </div>
                          <div className="flex items-center space-x-1">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleMarkAsRead(notification.id)}
                                title="Segna come letta"
                              >
                                <CheckCircle className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteNotification(notification.id)}
                              title="Elimina notifica"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              <div className="p-3 border-t bg-gray-50">
                <div className="flex items-center justify-between">
                  <Link
                    to="/notifications"
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Visualizza tutte le notifiche
                  </Link>
                  {notifications.length > 0 && (
                    <div className="flex items-center space-x-2">
                      {unreadCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={markAllNotificationsAsRead}
                          className="text-xs"
                        >
                          Segna tutte come lette
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearNotifications}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Cancella tutte
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile */}
          <UserProfile />
        </div>
      </div>

    </header>
  );
};