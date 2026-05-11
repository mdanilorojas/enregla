import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type EventType =
  | 'created'
  | 'status_changed'
  | 'document_uploaded'
  | 'document_deleted'
  | 'assigned'
  | 'unassigned'
  | 'renewed'
  | 'dates_updated';

export interface PermitEvent {
  id: string;
  permit_id: string;
  actor_id: string | null;
  event_type: EventType;
  from_value: string | null;
  to_value: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export function usePermitEvents(permitId: string | null | undefined) {
  return useQuery({
    queryKey: ['permit_events', permitId],
    queryFn: async (): Promise<PermitEvent[]> => {
      if (!permitId) return [];
      // casting due to stale generated types — see audit follow-up
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('permit_events')
        .select('*')
        .eq('permit_id', permitId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data as unknown as PermitEvent[]) ?? [];
    },
    enabled: !!permitId,
    staleTime: 30 * 1000,
  });
}
