import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppStore {
  // UI State
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  
  // Search
  globalSearchTerm: string;
  searchHistory: string[];
  
  // Notifications
  notifications: Notification[];
  
  // Settings
  settings: {
    itemsPerPage: number;
    currency: string;
    dateFormat: string;
    language: string;
    emailNotifications: boolean;
    desktopNotifications: boolean;
  };
  
  // Actions
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setGlobalSearchTerm: (term: string) => void;
  addToSearchHistory: (term: string) => void;
  clearSearchHistory: () => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  updateSettings: (settings: Partial<AppStore['settings']>) => void;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      sidebarCollapsed: false,
      theme: 'light',
      globalSearchTerm: '',
      searchHistory: [],
      notifications: [],
      settings: {
        itemsPerPage: 25,
        currency: 'EUR',
        dateFormat: 'dd/MM/yyyy',
        language: 'it',
        emailNotifications: true,
        desktopNotifications: true
      },

      // Actions
      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),

      setTheme: (theme) =>
        set({ theme }),

      setGlobalSearchTerm: (term) =>
        set({ globalSearchTerm: term }),

      addToSearchHistory: (term) =>
        set((state) => {
          const history = [
            term,
            ...state.searchHistory.filter(item => item !== term)
          ].slice(0, 10); // Keep only last 10 searches
          return { searchHistory: history };
        }),

      clearSearchHistory: () =>
        set({ searchHistory: [] }),

      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: Date.now().toString(),
              timestamp: new Date(),
              read: false
            },
            ...state.notifications
          ].slice(0, 50) // Keep only last 50 notifications
        })),

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        })),

      clearNotifications: () =>
        set({ notifications: [] }),

      markNotificationAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map(n => 
            n.id === id ? { ...n, read: true } : n
          )
        })),

      markAllNotificationsAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true }))
        })),

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        }))
    }),
    {
      name: 'pixel-crm-store',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        searchHistory: state.searchHistory,
        settings: state.settings,
        notifications: state.notifications
      })
    }
  )
);

// Custom hooks for specific store slices
export const useUI = () => useStore((state) => ({
  sidebarCollapsed: state.sidebarCollapsed,
  theme: state.theme,
  setSidebarCollapsed: state.setSidebarCollapsed,
  setTheme: state.setTheme
}));

export const useSearch = () => useStore((state) => ({
  globalSearchTerm: state.globalSearchTerm,
  searchHistory: state.searchHistory,
  setGlobalSearchTerm: state.setGlobalSearchTerm,
  addToSearchHistory: state.addToSearchHistory,
  clearSearchHistory: state.clearSearchHistory
}));

export const useNotifications = () => useStore((state) => ({
  notifications: state.notifications,
  addNotification: state.addNotification,
  removeNotification: state.removeNotification,
  clearNotifications: state.clearNotifications,
  markNotificationAsRead: state.markNotificationAsRead,
  markAllNotificationsAsRead: state.markAllNotificationsAsRead
}));

export const useSettings = () => useStore((state) => ({
  settings: state.settings,
  updateSettings: state.updateSettings
}));