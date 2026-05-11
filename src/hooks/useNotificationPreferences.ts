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

        // DB columns son nullable; default a true si falta
        setPreferences({
          email_enabled: data.email_enabled ?? true,
          expiry_alerts_enabled: data.expiry_alerts_enabled ?? true,
          digest_enabled: data.digest_enabled ?? true,
        });
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
      // casting due to stale generated types — see audit follow-up
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
