import { useState } from 'react';
import { 
  Bell, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  AlertTriangle,
  Clock,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { useNotifications } from '../store/useStore';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

export const typeIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
};

export const typeColors = {
  success: 'text-green-600 bg-green-100',
  error: 'text-red-600 bg-red-100',
  warning: 'text-yellow-600 bg-yellow-100',
  info: 'text-blue-600 bg-blue-100'
};

export const typeBorders = {
  success: 'border-green-200',
  error: 'border-red-200',
  warning: 'border-yellow-200',
  info: 'border-blue-200'
};

export const NotificationsPage = () => {
  const { 
    notifications, 
    removeNotification, 
    clearNotifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead 
  } = useNotifications();
  
  const [filterType, setFilterType] = useState<'all' | 'success' | 'error' | 'warning' | 'info'>('all');
  const [filterRead, setFilterRead] = useState<'all' | 'read' | 'unread'>('all');

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesType = filterType === 'all' || notification.type === filterType;
    const matchesRead = filterRead === 'all' || 
      (filterRead === 'read' && notification.read) ||
      (filterRead === 'unread' && !notification.read);
    
    return matchesType && matchesRead;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    markNotificationAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead();
  };

  const handleDeleteNotification = (id: string) => {
    removeNotification(id);
  };

  const handleClearAll = () => {
    if (confirm('Sei sicuro di voler eliminare tutte le notifiche?')) {
      clearNotifications();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifiche</h1>
          <p className="text-gray-600 mt-1">
            Gestisci le tue notifiche e avvisi del sistema
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="outline">
              <CheckCircle className="w-4 h-4 mr-2" />
              Segna tutte come lette ({unreadCount})
            </Button>
          )}
          {notifications.length > 0 && (
            <Button onClick={handleClearAll} variant="outline" className="text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4 mr-2" />
              Cancella tutte
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i tipi</SelectItem>
                  <SelectItem value="success">Successo</SelectItem>
                  <SelectItem value="error">Errori</SelectItem>
                  <SelectItem value="warning">Avvisi</SelectItem>
                  <SelectItem value="info">Informazioni</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={filterRead} onValueChange={(value: any) => setFilterRead(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte</SelectItem>
                  <SelectItem value="unread">Non lette</SelectItem>
                  <SelectItem value="read">Lette</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Notifiche ({filteredNotifications.length})</span>
          </CardTitle>
          <CardDescription>
            Lista di tutte le notifiche del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {notifications.length === 0 
                  ? 'Nessuna notifica disponibile' 
                  : 'Nessuna notifica corrisponde ai filtri selezionati'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => {
                const Icon = typeIcons[notification.type];
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                      notification.read 
                        ? 'bg-gray-50 border-gray-200' 
                        : `bg-white ${typeBorders[notification.type]} shadow-sm`
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${typeColors[notification.type]}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className={`font-semibold ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                              {notification.title}
                            </h3>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            )}
                          </div>
                          {notification.message && (
                            <p className={`text-sm mt-1 ${notification.read ? 'text-gray-500' : 'text-gray-600'}`}>
                              {notification.message}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-1 text-xs text-gray-400">
                              <Clock className="w-3 h-3" />
                              <span>
                                {formatDistanceToNow(notification.timestamp, { 
                                  addSuffix: true, 
                                  locale: it 
                                })}
                              </span>
                            </div>
                            {notification.action && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={notification.action.onClick}
                                className="text-xs"
                              >
                                {notification.action.label}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!notification.read && (
                            <DropdownMenuItem onClick={() => handleMarkAsRead(notification.id)}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Segna come letta
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleDeleteNotification(notification.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Elimina
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
export default NotificationsPage;