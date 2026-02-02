import { useState, useEffect, useCallback } from 'react';
import { adminRealtimeService, AdminStats } from '@/lib/admin-realtime-service';

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refreshStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const newStats = await adminRealtimeService.getStats(true);
      setStats(newStats);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to fetch stats');
      console.error('Error refreshing stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial load
    refreshStats();

    // Subscribe to real-time updates
    const unsubscribe = adminRealtimeService.subscribe('admin-stats-hook', (data) => {
      if (data.event === 'stats_updated') {
        setStats(data.data);
        setLastUpdated(new Date());
      } else if (data.event === 'product_change' || data.event === 'order_change' || data.event === 'profile_change') {
        // Refresh stats when relevant data changes
        refreshStats();
      }
    });

    return unsubscribe;
  }, [refreshStats]);

  return {
    stats,
    loading,
    error,
    lastUpdated,
    refreshStats
  };
}