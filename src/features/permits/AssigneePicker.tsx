import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCompany } from '@/hooks/useCompany';
import { useRequirementFor } from '@/lib/domain/permit-requirements';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BusinessRole } from '@/lib/domain/permit-roles';
import { BUSINESS_ROLE_LABELS, roleMatches } from '@/lib/domain/permit-roles';
import { AlertTriangle } from '@/lib/lucide-icons';

interface Props {
  permitId: string;
  permitType: string;
  companyId: string;
  currentAssigneeId: string | null;
  onChanged?: () => void;
}

interface TeamMember {
  id: string;
  full_name: string;
  business_role: BusinessRole;
}

export function AssigneePicker({ permitId, permitType, companyId, currentAssigneeId, onChanged }: Props) {
  const queryClient = useQueryClient();
  const { data: company } = useCompany(companyId);
  const req = useRequirementFor(permitType, company?.business_type);
  const [saving, setSaving] = useState(false);

  const { data: members } = useQuery({
    queryKey: ['team_members', companyId],
    queryFn: async (): Promise<TeamMember[]> => {
      // casting due to stale generated types — see audit follow-up
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('id, full_name, business_role')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('full_name');
      if (error) throw new Error(error.message);
      return (data as unknown as TeamMember[]) ?? [];
    },
    enabled: !!companyId,
  });

  const selected = members?.find(m => m.id === currentAssigneeId) ?? null;
  const requiredRole = req?.required_role;

  async function onChange(newId: string) {
    setSaving(true);
    try {
      const target = newId === 'unassigned' ? null : newId;
      // casting due to stale generated types — see audit follow-up
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('permits') as any)
        .update({ assigned_to_profile_id: target })
        .eq('id', permitId);
      if (error) throw new Error(error.message);
      queryClient.invalidateQueries({ queryKey: ['permits'] });
      queryClient.invalidateQueries({ queryKey: ['permit_events', permitId] });
      onChanged?.();
    } finally {
      setSaving(false);
    }
  }

  const roleMismatch =
    selected && requiredRole && !roleMatches(selected.business_role, requiredRole);

  return (
    <div className="flex flex-col gap-1">
      <Select value={currentAssigneeId ?? 'unassigned'} onValueChange={onChange} disabled={saving}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Sin asignar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unassigned">— Sin asignar —</SelectItem>
          {members?.map(m => (
            <SelectItem key={m.id} value={m.id}>
              <div className="flex items-center gap-2">
                <span>{m.full_name}</span>
                <span className="text-xs text-[var(--ds-text-subtle)]">({BUSINESS_ROLE_LABELS[m.business_role]})</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {roleMismatch && requiredRole && requiredRole !== 'anyone' && (
        <div className="flex items-start gap-2 text-xs text-[var(--ds-text-warning)] mt-1">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Este permiso requiere <strong>{BUSINESS_ROLE_LABELS[requiredRole as BusinessRole]}</strong>. Podés continuar, pero verificá el flujo.
          </span>
        </div>
      )}
    </div>
  );
}
