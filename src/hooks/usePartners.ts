import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Partner } from '@/types/crm';

export function usePartners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    supabase
      .from('partners')
      .select('*')
      .order('score_total', { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          console.error('Error fetching partners:', fetchError);
          setError(fetchError.message || 'Failed to fetch partners');
          setPartners([]);
        } else {
          setPartners((data as Partner[]) ?? []);
          setError(null);
        }
        setLoading(false);
      });
  }, []);

  const refetch = async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('partners')
      .select('*')
      .order('score_total', { ascending: false });

    if (fetchError) {
      console.error('Error fetching partners:', fetchError);
      setError(fetchError.message || 'Failed to fetch partners');
    } else {
      setPartners((data as Partner[]) ?? []);
      setError(null);
    }
    setLoading(false);
  };

  /**
   * Create a new partner. Returns the new partner id, or null on error.
   */
  const createPartner = async (input: Partial<Partner>): Promise<string | null> => {
    // casting due to stale generated types — see audit follow-up
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: insertError } = await (supabase.from('partners') as any)
      .insert(input)
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating partner:', insertError);
      setError(insertError.message || 'Failed to create partner');
      return null;
    }

    await refetch();
    return (data as { id: string }).id;
  };

  /**
   * Update a partner record
   */
  const updatePartner = async (id: string, updates: Partial<Partner>): Promise<boolean> => {
    // casting due to stale generated types — see audit follow-up
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase.from('partners') as any)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating partner:', updateError);
      setError(updateError.message || 'Failed to update partner');
      return false;
    }

    await refetch();
    return true;
  };

  /**
   * Delete a partner permanently
   */
  const deletePartner = async (id: string): Promise<boolean> => {
    const { error: deleteError } = await supabase.from('partners').delete().eq('id', id);

    if (deleteError) {
      console.error('Error deleting partner:', deleteError);
      setError(deleteError.message || 'Failed to delete partner');
      return false;
    }

    await refetch();
    return true;
  };

  return {
    partners,
    loading,
    error,
    refetch,
    createPartner,
    updatePartner,
    deletePartner,
  };
}
