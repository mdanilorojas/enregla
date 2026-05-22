import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DEMO_USER_ID } from '@/lib/demo'

export interface NotificationItem {
  id: string
  user_id: string
  permit_id: string
  notification_type: string
  email_status: string
  sent_at: string | null
  created_at: string | null
  read_at: string | null
  permit?: {
    type: string | null
    expiry_date: string | null
    location_id: string | null
    location?: { name: string | null } | null
  } | null
}

const PAGE_SIZE = 50

export function useNotifications(userId: string | undefined) {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    if (!userId) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const targetUserIds = [userId]
      if (userId !== DEMO_USER_ID) targetUserIds.push(DEMO_USER_ID)

      const { data, error: err } = await supabase
        .from('notification_logs')
        .select(`
          id, user_id, permit_id, notification_type, email_status,
          sent_at, created_at, read_at,
          permit:permits!notification_logs_permit_id_fkey (
            type, expiry_date, location_id,
            location:locations!permits_location_id_fkey ( name )
          )
        `)
        .in('user_id', targetUserIds)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)

      if (err) throw err
      setItems((data ?? []) as unknown as NotificationItem[])
      setError(null)
    } catch (e) {
      console.error('[useNotifications] fetch error:', e)
      setError(e instanceof Error ? e.message : 'Error al cargar notificaciones')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void fetchItems()
  }, [fetchItems])

  // Realtime: refresh on INSERT/UPDATE for this user
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notification_logs', filter: `user_id=eq.${userId}` },
        () => void fetchItems(),
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId, fetchItems])

  const unreadCount = items.filter(i => !i.read_at).length

  const markAsRead = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return
    const now = new Date().toISOString()
    setItems(prev => prev.map(i => (ids.includes(i.id) && !i.read_at ? { ...i, read_at: now } : i)))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query = supabase.from('notification_logs') as any
    const { error: err } = await query.update({ read_at: now }).in('id', ids).is('read_at', null)
    if (err) {
      console.error('[useNotifications] markAsRead error:', err)
      void fetchItems()
    }
  }, [fetchItems])

  const markAllAsRead = useCallback(async () => {
    const unreadIds = items.filter(i => !i.read_at).map(i => i.id)
    if (unreadIds.length === 0) return
    await markAsRead(unreadIds)
  }, [items, markAsRead])

  return { items, loading, error, unreadCount, refetch: fetchItems, markAsRead, markAllAsRead }
}
