import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { useAuth } from './useAuth';

vi.mock('../lib/supabase', () => {
  return {
    supabase: {
      auth: {
        // getSession never resolves to simulate network hang
        getSession: vi.fn(() => new Promise(() => {})),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
      }
    }
  };
});

describe('useAuth timeout', () => {
  it('exposes timeout error when getSession stalls', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useAuth());
    expect(result.current.loading).toBe(true);
    vi.advanceTimersByTime(8000);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Connection timeout');
    vi.useRealTimers();
  });
});