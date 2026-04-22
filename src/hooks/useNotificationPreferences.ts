import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface NotificationPreferences {
  email_enabled: boolean;
  expiry_alerts_enabled: boolean;
  digest_enabled: boolean;
}

export function useNotificationPreferences(userId: string | undefined) {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch preferences
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchPreferences() {
      try {
        const { data, error } = await supabase
          .from('notification_preferences')
          .select('email_enabled, expiry_alerts_enabled, digest_enabled')
          .eq('user_id', userId as string)
          .single();

        if (error) throw error;

        setPreferences(data);
        setError(null);
      } catch (err) {
        console.error('[useNotificationPreferences] Error fetching preferences:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar preferencias');
      } finally {
        setLoading(false);
      }
    }

    fetchPreferences();
  }, [userId]);

  // Update preferences
  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!userId) return;

    try {
      const query = supabase.from('notification_preferences') as any;
      const { error } = await query
        .update(updates)
        .eq('user_id', userId);

      if (error) throw error;

      setPreferences(prev => prev ? { ...prev, ...updates } : null);
      setError(null);
    } catch (err) {
      console.error('[useNotificationPreferences] Error updating preferences:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar preferencias');
      throw err;
    }
  };

  return {
    preferences,
    loading,
    error,
    updatePreferences,
  };
}
