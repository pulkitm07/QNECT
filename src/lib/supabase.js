/**
 * Supabase client
 * Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.
 * Until then, the app runs entirely on local mock state (QueueContext).
 */
import { createClient } from '@supabase/supabase-js'

const url  = import.meta.env.VITE_SUPABASE_URL  || ''
const key  = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = url && key ? createClient(url, key) : null

/* ─── Queue helpers ──────────────────────────────────────────────────────── */
export async function fetchQueue() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('queue')
    .select('*')
    .eq('status', 'waiting')
    .order('joined_at', { ascending: true })
  if (error) { console.error(error); return [] }
  return data
}

export async function insertQueueEntry(entry) {
  if (!supabase) return null
  const { data, error } = await supabase.from('queue').insert([entry]).select().single()
  if (error) { console.error(error); return null }
  return data
}

export async function updateQueueStatus(id, status) {
  if (!supabase) return
  await supabase.from('queue').update({ status }).eq('id', id)
}

/* ─── Realtime subscription ──────────────────────────────────────────────── */
export function subscribeToQueue(callback) {
  if (!supabase) return () => {}
  const channel = supabase
    .channel('queue-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'queue' }, callback)
    .subscribe()
  return () => supabase.removeChannel(channel)
}

/* ─── Delivery helpers ───────────────────────────────────────────────────── */
export async function insertDelivery(entry) {
  if (!supabase) return null
  const { data, error } = await supabase.from('deliveries').insert([entry]).select().single()
  if (error) { console.error(error); return null }
  return data
}

export async function updateDeliveryStep(id, step) {
  if (!supabase) return
  await supabase.from('deliveries').update({ step }).eq('id', id)
}
