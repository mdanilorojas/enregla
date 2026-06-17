import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Banner } from '@/components/ui/banner'
import { Badge } from '@/components/ui/badge'
import { Mail, Trash2, Users, Copy, Check } from '@/lib/lucide-icons'
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
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

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
    if (!email.trim() || !companyId || !profile?.id) return
    setInviting(true)
    setError(null)
    setInviteLink(null)
    setCopied(false)
    try {
      const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, '')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insErr } = await (supabase as any)
        .from('company_invitations')
        .insert({
          company_id: companyId,
          email: email.trim().toLowerCase(),
          role,
          token,
          invited_by: profile.id,
        })
      if (insErr) throw new Error(insErr.message)

      const link = `${window.location.origin}/aceptar-invitacion?token=${token}`
      setInviteLink(link)
      try {
        await navigator.clipboard.writeText(link)
        toast.success('Invitación creada · enlace copiado')
      } catch {
        toast.success('Invitación creada')
      }
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

  const copyLink = async () => {
    if (!inviteLink) return
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('No se pudo copiar')
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
            {inviting ? 'Creando...' : 'Crear invitación'}
          </Button>
        </div>
        <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mt-[var(--ds-space-100)]">
          Se genera un enlace de invitación (válido 7 días) que puedes compartir con la persona.
        </p>

        {inviteLink && (
          <div className="mt-[var(--ds-space-200)] flex items-center gap-[var(--ds-space-100)] p-[var(--ds-space-150)] rounded-[var(--ds-radius-200)] bg-[var(--ds-neutral-50)] border border-[var(--ds-border)]">
            <span className="flex-1 min-w-0 truncate text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
              {inviteLink}
            </span>
            <Button variant="outline" size="sm" onClick={copyLink}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado' : 'Copiar enlace'}
            </Button>
          </div>
        )}
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
