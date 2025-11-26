import { useEffect, useMemo } from 'react';
import { X, Bell, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { useNotifications } from '../store/useStore';
import { cn } from '../lib/cn';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

const iconMap = {
  success: CheckCircle,
  error: AlertTriangle,
  warning: Bell,
  info: Info,
};

const variantClasses: Record<
  keyof typeof iconMap,
  { container: string; icon: string }
> = {
  success: {
    container: 'border-green-200 bg-green-50 text-green-900',
    icon: 'text-green-500',
  },
  error: {
    container: 'border-red-200 bg-red-50 text-red-900',
    icon: 'text-red-500',
  },
  warning: {
    container: 'border-yellow-200 bg-yellow-50 text-yellow-900',
    icon: 'text-yellow-500',
  },
  info: {
    container: 'border-blue-200 bg-blue-50 text-blue-900',
    icon: 'text-blue-500',
  },
};

const AUTO_DISMISS_MS = 3_000;

function Toast() {
  const { notifications, markNotificationAsRead } = useNotifications();
  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.read),
    [notifications]
  );

  useEffect(() => {
    if (!unreadNotifications.length) return;
    const timers = unreadNotifications.map((notification) =>
      window.setTimeout(() => {
        markNotificationAsRead(notification.id);
      }, AUTO_DISMISS_MS)
    );

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [unreadNotifications, markNotificationAsRead]);

  if (!unreadNotifications.length) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm">
      {unreadNotifications.map((notification) => {
        const IconComponent = iconMap[notification.type];
        const classes = variantClasses[notification.type];
        const timestampLabel = formatDistanceToNow(
          new Date(notification.timestamp),
          { addSuffix: true, locale: it }
        );

        return (
          <div
            key={notification.id}
            className={cn(
              'rounded-lg border p-4 shadow-lg backdrop-blur bg-opacity-95',
              classes.container
            )}
          >
            <div className="flex items-start gap-3">
              <IconComponent className={cn('w-5 h-5', classes.icon)} />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold leading-snug">
                      {notification.title}
                    </p>
                    {notification.message && (
                      <p className="text-sm mt-1">{notification.message}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="text-current/70 hover:text-current transition-colors"
                    onClick={() => markNotificationAsRead(notification.id)}
                    aria-label="Chiudi notifica"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs opacity-70 mt-2">{timestampLabel}</div>
                {notification.action && (
                  <button
                    type="button"
                    className="text-sm font-semibold underline mt-2"
                    onClick={notification.action.onClick}
                  >
                    {notification.action.label}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Toast;
