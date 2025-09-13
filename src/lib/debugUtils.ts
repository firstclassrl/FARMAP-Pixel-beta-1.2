// Debug utilities for troubleshooting
export const debugLog = (component: string, message: string, data?: any) => {
  if (import.meta.env.DEV) {
    console.log(`🔍 [${component}] ${message}`, data || '');
  }
};

export const debugError = (component: string, error: any, context?: string) => {
  console.error(`🔍 [${component}] ERROR${context ? ` in ${context}` : ''}:`, error);
};

export const debugAuth = (message: string, data?: any) => {
  debugLog('AUTH', message, data);
};

export const debugDB = (message: string, data?: any) => {
  debugLog('DATABASE', message, data);
};

export const debugAPI = (message: string, data?: any) => {
  debugLog('API', message, data);
};

// Performance monitoring
export const measurePerformance = (name: string, fn: () => Promise<any>) => {
  return async (...args: any[]) => {
    const start = performance.now();
    try {
      const result = await fn.apply(null, args);
      const end = performance.now();
      debugLog('PERFORMANCE', `${name} took ${(end - start).toFixed(2)}ms`);
      return result;
    } catch (error) {
      const end = performance.now();
      debugError('PERFORMANCE', error, `${name} failed after ${(end - start).toFixed(2)}ms`);
      throw error;
    }
  };
};

// Connection health check
export const checkAppHealth = async () => {
  const checks = {
    supabase: false,
    auth: false,
    database: false
  };

  try {
    // Test Supabase connection
    const { supabase } = await import('./supabase');
    
    // Test basic query
    const { error: dbError } = await supabase.from('profiles').select('count').limit(1);
    checks.database = !dbError;
    checks.supabase = true;

    // Test auth
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    checks.auth = !authError;

    debugLog('HEALTH_CHECK', 'App health check completed', checks);
    return checks;
  } catch (error) {
    debugError('HEALTH_CHECK', error);
    return checks;
  }
};