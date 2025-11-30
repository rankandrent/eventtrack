import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Event = {
  id: string
  name: string
  description?: string
  event_date: string
  venue: string
  venue_address?: string
  host_name?: string
  host_phone?: string
  max_guests?: number
  cover_image?: string
  created_at: string
  updated_at: string
}

export type Guest = {
  id: string
  event_id: string
  name: string
  phone: string
  email?: string
  qr_code: string
  invitation_sent: boolean
  invitation_sent_at?: string
  checked_in: boolean
  checked_in_at?: string
  plus_ones: number
  notes?: string
  created_at: string
  updated_at: string
}

export type CheckinLog = {
  id: string
  guest_id: string
  event_id: string
  scanned_qr: string
  success: boolean
  failure_reason?: string
  scanned_by?: string
  device_info?: string
  created_at: string
}

export type WhatsAppLog = {
  id: string
  guest_id: string
  event_id: string
  message_type: 'invitation' | 'reminder' | 'confirmation'
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  error_message?: string
  sent_at?: string
  created_at: string
}

