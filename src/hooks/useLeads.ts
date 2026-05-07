import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Lead, LeadStatus } from '@/types/crm';

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          console.error('Error fetching leads:', fetchError);
          setError(fetchError.message || 'Failed to fetch leads');
          setLeads([]);
        } else {
          setLeads((data as Lead[]) ?? []);
          setError(null);
        }
        setLoading(false);
      });
  }, []);

  const refetch = async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching leads:', fetchError);
      setError(fetchError.message || 'Failed to fetch leads');
    } else {
      setLeads((data as Lead[]) ?? []);
      setError(null);
    }
    setLoading(false);
  };

  /**
   * Update a lead record
   */
  const updateLead = async (id: string, updates: Partial<Lead>): Promise<boolean> => {
    const { error: updateError } = await (supabase.from('leads') as any)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating lead:', updateError);
      setError(updateError.message || 'Failed to update lead');
      return false;
    }

    await refetch();
    return true;
  };

  /**
   * Set the pipeline status for a lead (nuevo, contactado, demo_agendada, ...)
   */
  const setStatus = (id: string, status: LeadStatus): Promise<boolean> => {
    return updateLead(id, { status });
  };

  /**
   * Delete a lead permanently
   */
  const deleteLead = async (id: string): Promise<boolean> => {
    const { error: deleteError } = await supabase.from('leads').delete().eq('id', id);

    if (deleteError) {
      console.error('Error deleting lead:', deleteError);
      setError(deleteError.message || 'Failed to delete lead');
      return false;
    }

    await refetch();
    return true;
  };

  return {
    leads,
    loading,
    error,
    refetch,
    updateLead,
    setStatus,
    deleteLead,
  };
}
