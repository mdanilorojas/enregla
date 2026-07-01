import { useState } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Building2, ShieldCheck, Check, CheckCircle2 } from '@/lib/lucide-icons';

interface Props {
  permitId: string;
  delegatedToEnregla: boolean;
  delegationRequestedAt?: string | null;
  onChanged?: () => void;
}

export function PermitAssignment({
  permitId,
  delegatedToEnregla,
  delegationRequestedAt,
  onChanged,
}: Props) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function persist(patch: Record<string, unknown>): Promise<boolean> {
    setSaving(true);
    try {
      // casting due to stale generated types — see audit follow-up
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('permits') as any)
        .update(patch)
        .eq('id', permitId)
        .select('id');
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) {
        throw new Error('No se pudo guardar la asignación. Verifica tus permisos.');
      }
      queryClient.invalidateQueries({ queryKey: ['permits'] });
      queryClient.invalidateQueries({ queryKey: ['permit_events', permitId] });
      onChanged?.();
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al asignar');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function assignSelf() {
    if (!delegatedToEnregla) return;
    const ok = await persist({
      delegated_to_enregla: false,
      delegation_requested_by: null,
      delegation_requested_at: null,
      assigned_to_profile_id: profile?.id ?? null,
    });
    if (ok) toast.success('Asignado a tu empresa');
  }

  async function confirmEnregla() {
    setConfirmOpen(false);
    const ok = await persist({
      delegated_to_enregla: true,
      delegation_requested_by: profile?.id ?? null,
      delegation_requested_at: new Date().toISOString(),
    });
    if (!ok) return;

    // Avisar al equipo (hola@enregla.ec). Best-effort: la delegación ya quedó
    // guardada en DB aunque el email falle.
    try {
      const [{ data: permit }, { data: auth }] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('permits') as any).select('type').eq('id', permitId).maybeSingle(),
        supabase.auth.getUser(),
      ]);
      const email = auth?.user?.email;
      const { error: notifyErr } = await supabase.functions.invoke('notify-lead', {
        body: {
          nombre: profile?.full_name || email || 'Cliente',
          email,
          permitType: permit?.type,
          source: 'delegacion-permiso',
        },
      });
      if (notifyErr) throw notifyErr;
      toast.success('EnRegla fue notificado');
    } catch (e) {
      console.error('notify-lead (delegación) falló:', e);
      toast.success('Delegación guardada · te contactaremos pronto');
    }
  }

  return (
    <div className="flex flex-col gap-[var(--ds-space-150)]">
      <div className="grid grid-cols-2 gap-[var(--ds-space-150)]">
        <OptionCard
          icon={<Building2 className="w-5 h-5" />}
          title="Mi empresa"
          subtitle="Yo me encargo"
          selected={!delegatedToEnregla}
          disabled={saving}
          onClick={assignSelf}
        />
        <OptionCard
          icon={<ShieldCheck className="w-5 h-5" />}
          title="EnRegla"
          subtitle="Nosotros lo tramitamos"
          selected={delegatedToEnregla}
          disabled={saving}
          onClick={() => !delegatedToEnregla && setConfirmOpen(true)}
        />
      </div>

      {delegatedToEnregla && (
        <div className="flex items-start gap-[var(--ds-space-100)] rounded-[var(--ds-radius-200)] bg-[var(--ds-blue-50)] p-[var(--ds-space-200)]">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[var(--ds-text-brand)]" />
          <div className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
            EnRegla fue notificado y se encargará de este permiso. Te contactaremos.
            {delegationRequestedAt && (
              <span className="block text-[var(--ds-text-subtlest)]">
                Solicitado el {new Date(delegationRequestedAt).toLocaleDateString('es-EC')}
              </span>
            )}
          </div>
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={(o) => !saving && setConfirmOpen(o)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delegar a EnRegla</DialogTitle>
            <DialogDescription>
              Seremos notificados de que quieres que tramitemos este permiso.
              Empezaremos y te contactaremos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-[var(--ds-space-300)]">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={confirmEnregla} loading={saving}>
              <Check className="w-4 h-4" />
              Aceptar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OptionCard({
  icon,
  title,
  subtitle,
  selected,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`flex flex-col items-start gap-[var(--ds-space-050)] rounded-[var(--ds-radius-200)] border p-[var(--ds-space-200)] text-left transition-colors disabled:opacity-60 ${
        selected
          ? 'border-[var(--ds-background-brand)] bg-[var(--ds-blue-50)] text-[var(--ds-text-brand)]'
          : 'border-[var(--ds-border)] bg-[var(--ds-neutral-0)] text-[var(--ds-text-subtle)] hover:border-[var(--ds-border-bold)]'
      }`}
    >
      <span className="flex items-center gap-[var(--ds-space-100)] font-semibold text-[var(--ds-font-size-100)]">
        {icon}
        {title}
        {selected && <Check className="w-4 h-4" />}
      </span>
      <span className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">{subtitle}</span>
    </button>
  );
}
