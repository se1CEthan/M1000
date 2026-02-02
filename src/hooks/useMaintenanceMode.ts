import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/clients';

export interface MaintenanceSettings {
  isMaintenanceMode: boolean;
  maintenanceMessage: string;
  estimatedTime: string;
  loading: boolean;
  error: string | null;
}

export function useMaintenanceMode() {
  const [settings, setSettings] = useState<MaintenanceSettings>({
    isMaintenanceMode: false,
    maintenanceMessage: 'We are currently performing scheduled maintenance. Please check back soon!',
    estimatedTime: '',
    loading: true,
    error: null
  });

  const fetchMaintenanceSettings = async () => {
    try {
      setSettings(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase
        .from('platform_settings')
        .select('key, value')
        .in('key', ['maintenance_mode', 'maintenance_message', 'maintenance_estimated_time']);

      if (error) throw error;

      const settingsMap = new Map(data?.map(item => [item.key, item.value]) || []);

      // Parse JSONB values
      const parseJsonValue = (value: any) => {
        if (typeof value === 'string') return value;
        if (typeof value === 'object' && value !== null) return JSON.stringify(value).replace(/^"|"$/g, '');
        return String(value || '');
      };

      setSettings(prev => ({
        ...prev,
        isMaintenanceMode: parseJsonValue(settingsMap.get('maintenance_mode')) === 'true',
        maintenanceMessage: parseJsonValue(settingsMap.get('maintenance_message')) || prev.maintenanceMessage,
        estimatedTime: parseJsonValue(settingsMap.get('maintenance_estimated_time')) || '',
        loading: false
      }));

    } catch (err: any) {
      console.error('Error fetching maintenance settings:', err);
      setSettings(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to fetch maintenance settings'
      }));
    }
  };

  const updateMaintenanceMode = async (enabled: boolean, message?: string, estimatedTime?: string) => {
    try {
      const updates = [
        { key: 'maintenance_mode', value: JSON.stringify(enabled.toString()) }
      ];

      if (message !== undefined) {
        updates.push({ key: 'maintenance_message', value: JSON.stringify(message) });
      }

      if (estimatedTime !== undefined) {
        updates.push({ key: 'maintenance_estimated_time', value: JSON.stringify(estimatedTime) });
      }

      for (const update of updates) {
        const { error } = await supabase
          .from('platform_settings')
          .update({
            value: update.value,
            updated_at: new Date().toISOString()
          })
          .eq('key', update.key);

        if (error) throw error;
      }

      // Refresh settings after update
      await fetchMaintenanceSettings();

      return true;
    } catch (err: any) {
      console.error('Error updating maintenance mode:', err);
      setSettings(prev => ({
        ...prev,
        error: err.message || 'Failed to update maintenance settings'
      }));
      return false;
    }
  };

  useEffect(() => {
    fetchMaintenanceSettings();

    // Set up real-time subscription for maintenance settings changes
    const subscription = supabase
      .channel('maintenance-settings')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'platform_settings',
          filter: 'key=in.(maintenance_mode,maintenance_message,maintenance_estimated_time)'
        }, 
        () => {
          fetchMaintenanceSettings();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    ...settings,
    updateMaintenanceMode,
    refetch: fetchMaintenanceSettings
  };
}