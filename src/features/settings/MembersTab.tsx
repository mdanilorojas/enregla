import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Banner } from '@/components/ui/banner'
import { Badge } from '@/components/ui/badge'
import { Mail, Trash2, Users } from '@/lib/lucide-icons'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

interface Invitation {
  id: string
  email: string
  role: string
  accepted_at: string | null
  revoked_at: string | null
  expires_at: string
  created_at: string
}

interface Member {
  id: string
  full_name: string
  role: string
}

export function MembersTab() {
  const { profile } = useAuth()
  const companyId = profile?.company_id
  const isAdmin = profile?.role === 'admin'

  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'operator' | 'viewer'>('operator')
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    if (!companyId) {
      setLoading(false)
      return
    }
    setLoading(true)
    // casting due to stale generated types — see audit follow-up
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const [m, inv] = await Promise.all([
      (supabase as any).from('profiles').select('id, full_name, role').eq('company_id', companyId).order('created_at'),
      (supabase as any).from('company_invitations').select('id, email, role, accepted_at, revoked_at, expires_at, created_at').eq('company_id', companyId).is('accepted_at', null).is('revoked_at', null).order('created_at', { ascending: false }),
    ])
    /* eslint-enable @typescript-eslint/no-explicit-any */
    setMembers(m.data ?? [])
    setInvitations(inv.data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId])

  const handleInvite = async () => {
    if (!email.trim()) return
    setInviting(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Tu sesión expiró. Inicia sesión de nuevo.')

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email: email.trim(), role }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'No se pudo enviar la invitación')
      }
      toast.success(data.email_sent ? 'Invitación enviada' : 'Invitación creada (email no enviado)')
      setEmail('')
      refresh()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error'
      setError(msg)
      toast.error(msg)
    } finally {
      setInviting(false)
    }
  }

  const revokeInvitation = async (id: string) => {
    if (!confirm('¿Revocar esta invitación?')) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (supabase as any)
      .from('company_invitations')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', id)
    if (err) {
      toast.error(err.message)
      return
    }
    toast.success('Invitación revocada')
    refresh()
  }

  if (!companyId) {
    return (
      <Card className="p-[var(--ds-space-400)]">
        <Banner variant="warning">Necesitas una empresa para gestionar miembros.</Banner>
      </Card>
    )
  }

  if (!isAdmin) {
    return (
      <Card className="p-[var(--ds-space-400)]">
        <Banner variant="info">Solo los administradores pueden invitar miembros.</Banner>
      </Card>
    )
  }

  return (
    <div className="space-y-[var(--ds-space-300)]">
      <Card className="p-[var(--ds-space-400)]">
        <h2 className="text-[var(--ds-font-size-300)] font-semibold mb-[var(--ds-space-200)] flex items-center gap-[var(--ds-space-100)]">
          <Mail className="w-5 h-5" />Invitar miembro
        </h2>

        {error && (
          <div className="mb-[var(--ds-space-200)]">
            <Banner variant="error">{error}</Banner>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-[var(--ds-space-100)]">
          <Input
            type="email"
            placeholder="colega@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={inviting}
            className="flex-1"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'admin' | 'operator' | 'viewer')}
            disabled={inviting}
            className="bg-white border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] px-[var(--ds-space-150)] py-[var(--ds-space-100)] text-[var(--ds-font-size-100)]"
          >
            <option value="operator">Operador</option>
            <option value="admin">Administrador</option>
            <option value="viewer">Solo lectura</option>
          </select>
          <Button variant="default" onClick={handleInvite} disabled={!email || inviting}>
            {inviting ? 'Enviando...' : 'Enviar invitación'}
          </Button>
        </div>
        <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mt-[var(--ds-space-100)]">
          Se envía un email con un enlace que expira en 7 días.
        </p>
      </Card>

      <Card className="p-[var(--ds-space-400)]">
        <h2 className="text-[var(--ds-font-size-300)] font-semibold mb-[var(--ds-space-200)] flex items-center gap-[var(--ds-space-100)]">
          <Users className="w-5 h-5" />Miembros ({members.length})
        </h2>
        {loading ? (
          <p className="text-[var(--ds-text-subtle)]">Cargando...</p>
        ) : (
          <ul className="space-y-[var(--ds-space-100)]">
            {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between p-[var(--ds-space-200)] rounded-[var(--ds-radius-200)] border border-[var(--ds-border)]">
                <span className="font-medium">{m.full_name}</span>
                <Badge variant={m.role === 'admin' ? 'status-vigente' : 'status-no-registrado'}>
                  {m.role === 'admin' ? 'Administrador' : m.role === 'operator' ? 'Operador' : 'Solo lectura'}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {invitations.length > 0 && (
        <Card className="p-[var(--ds-space-400)]">
          <h2 className="text-[var(--ds-font-size-300)] font-semibold mb-[var(--ds-space-200)]">
            Invitaciones pendientes ({invitations.length})
          </h2>
          <ul className="space-y-[var(--ds-space-100)]">
            {invitations.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between p-[var(--ds-space-200)] rounded-[var(--ds-radius-200)] border border-[var(--ds-border)]">
                <div>
                  <div className="font-medium">{inv.email}</div>
                  <div className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
                    {inv.role} · expira {new Date(inv.expires_at).toLocaleDateString('es-EC')}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => revokeInvitation(inv.id)} title="Revocar">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
