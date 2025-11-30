'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase, Event, Guest } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  ArrowLeft, Calendar, MapPin, Users, Send, QrCode, 
  CheckCircle2, Clock, Plus, Download, Upload, Trash2,
  Phone, Mail, Eye, Search, RefreshCw
} from 'lucide-react'
import { formatDate, formatTime, generateQRCode, formatPhone } from '@/lib/utils'
import { toast } from 'sonner'
import QRCode from 'qrcode'
import * as XLSX from 'xlsx'

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  
  const [event, setEvent] = useState<Event | null>(null)
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddGuest, setShowAddGuest] = useState(false)
  const [sendingInvites, setSendingInvites] = useState(false)
  const [newGuest, setNewGuest] = useState({ name: '', phone: '', email: '', plus_ones: '0' })

  const loadData = useCallback(async () => {
    try {
      const [eventRes, guestsRes] = await Promise.all([
        supabase.from('events').select('*').eq('id', eventId).single(),
        supabase.from('guests').select('*').eq('event_id', eventId).order('created_at', { ascending: false })
      ])

      if (eventRes.error) throw eventRes.error
      setEvent(eventRes.data)
      setGuests(guestsRes.data || [])
    } catch (error) {
      console.error('Error loading event:', error)
      toast.error('Failed to load event')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    loadData()

    // Set up real-time subscription for guests
    const channel = supabase
      .channel('guests-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'guests', filter: `event_id=eq.${eventId}` },
        () => loadData()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId, loadData])

  async function addGuest() {
    if (!newGuest.name || !newGuest.phone) {
      toast.error('Name and phone are required')
      return
    }

    try {
      const qrCode = generateQRCode()
      
      const { error } = await supabase.from('guests').insert({
        event_id: eventId,
        name: newGuest.name,
        phone: formatPhone(newGuest.phone),
        email: newGuest.email || null,
        qr_code: qrCode,
        plus_ones: parseInt(newGuest.plus_ones) || 0,
      })

      if (error) throw error

      setNewGuest({ name: '', phone: '', email: '', plus_ones: '0' })
      setShowAddGuest(false)
      toast.success('Guest added successfully')
      loadData()
    } catch (error) {
      console.error('Error adding guest:', error)
      toast.error('Failed to add guest')
    }
  }

  async function deleteGuest(guestId: string) {
    if (!confirm('Are you sure you want to remove this guest?')) return

    try {
      const { error } = await supabase.from('guests').delete().eq('id', guestId)
      if (error) throw error
      toast.success('Guest removed')
      loadData()
    } catch (error) {
      console.error('Error deleting guest:', error)
      toast.error('Failed to remove guest')
    }
  }

  async function downloadQRCode(guest: Guest) {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      const checkInUrl = `${appUrl}/checkin?code=${guest.qr_code}`
      
      const qrDataUrl = await QRCode.toDataURL(checkInUrl, {
        width: 400,
        margin: 2,
        color: { dark: '#0d1f38', light: '#ffffff' }
      })

      const link = document.createElement('a')
      link.download = `qr-${guest.name.replace(/\s+/g, '-').toLowerCase()}.png`
      link.href = qrDataUrl
      link.click()
    } catch (error) {
      console.error('Error generating QR:', error)
      toast.error('Failed to generate QR code')
    }
  }

  async function sendWhatsAppInvite(guest: Guest) {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      
      // Generate QR code image URL
      const checkInUrl = `${appUrl}/checkin?code=${guest.qr_code}`
      
      // Create WhatsApp message
      const message = `🎉 *You're Invited!*

Dear ${guest.name},

You are cordially invited to *${event?.name}*

📅 *Date:* ${formatDate(event?.event_date || '')}
⏰ *Time:* ${formatTime(event?.event_date || '')}
📍 *Venue:* ${event?.venue}
${event?.venue_address ? `\n📌 *Address:* ${event.venue_address}` : ''}

Your personal check-in link:
${checkInUrl}

Please show your QR code at the entrance for quick check-in.

${event?.host_name ? `Looking forward to seeing you!\n\n- ${event.host_name}` : ''}`.trim()

      // Open WhatsApp with pre-filled message
      const whatsappUrl = `https://wa.me/${guest.phone}?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, '_blank')

      // Update invitation status
      await supabase.from('guests').update({
        invitation_sent: true,
        invitation_sent_at: new Date().toISOString()
      }).eq('id', guest.id)

      // Log the message
      await supabase.from('whatsapp_logs').insert({
        guest_id: guest.id,
        event_id: eventId,
        message_type: 'invitation',
        status: 'sent',
        sent_at: new Date().toISOString()
      })

      toast.success(`Opening WhatsApp for ${guest.name}`)
      loadData()
    } catch (error) {
      console.error('Error sending invite:', error)
      toast.error('Failed to send invitation')
    }
  }

  async function sendAllInvites() {
    const uninvited = guests.filter(g => !g.invitation_sent)
    if (uninvited.length === 0) {
      toast.info('All invitations have been sent')
      return
    }

    setSendingInvites(true)
    
    for (const guest of uninvited) {
      await sendWhatsAppInvite(guest)
      await new Promise(r => setTimeout(r, 1000)) // Delay between messages
    }

    setSendingInvites(false)
    toast.success(`Sent ${uninvited.length} invitations`)
  }

  async function handleExcelUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]

      let added = 0
      for (const row of jsonData) {
        const name = row.Name || row.name || row.NAME
        const phone = row.Phone || row.phone || row.PHONE || row.Mobile || row.mobile
        const email = row.Email || row.email || row.EMAIL

        if (name && phone) {
          const qrCode = generateQRCode()
          const { error } = await supabase.from('guests').insert({
            event_id: eventId,
            name: String(name).trim(),
            phone: formatPhone(String(phone)),
            email: email ? String(email).trim() : null,
            qr_code: qrCode,
          })
          if (!error) added++
        }
      }

      toast.success(`Added ${added} guests from Excel`)
      loadData()
    } catch (error) {
      console.error('Error processing Excel:', error)
      toast.error('Failed to process Excel file')
    }
    
    e.target.value = ''
  }

  function exportGuestList() {
    const exportData = guests.map(g => ({
      Name: g.name,
      Phone: g.phone,
      Email: g.email || '',
      'QR Code': g.qr_code,
      'Invitation Sent': g.invitation_sent ? 'Yes' : 'No',
      'Checked In': g.checked_in ? 'Yes' : 'No',
      'Check-in Time': g.checked_in_at ? new Date(g.checked_in_at).toLocaleString() : '',
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Guests')
    XLSX.writeFile(wb, `${event?.name.replace(/\s+/g, '-')}-guests.xlsx`)
  }

  const filteredGuests = guests.filter(g =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.phone.includes(searchTerm)
  )

  const stats = {
    total: guests.length,
    invited: guests.filter(g => g.invitation_sent).length,
    checkedIn: guests.filter(g => g.checked_in).length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400">Event not found</p>
        <Link href="/admin/events">
          <Button variant="secondary" className="mt-4">Back to Events</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/events">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-white">{event.name}</h1>
            <p className="text-gray-400 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {formatDate(event.event_date)} at {formatTime(event.event_date)}
              <span className="text-gray-600">•</span>
              <MapPin className="w-4 h-4" />
              {event.venue}
            </p>
          </div>
        </div>
        <Link href={`/checkin?event=${event.id}`}>
          <Button variant="secondary">
            <QrCode className="w-4 h-4" />
            Open Scanner
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Guests', value: stats.total, icon: Users, color: 'text-blue-400' },
          { label: 'Invites Sent', value: stats.invited, icon: Send, color: 'text-gold-400' },
          { label: 'Checked In', value: stats.checkedIn, icon: CheckCircle2, color: 'text-green-400' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3">
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Guest Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Guest List</CardTitle>
            <CardDescription>Manage guests and send invitations</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer">
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelUpload} />
              <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all cursor-pointer">
                <Upload className="w-4 h-4" />
                Import Excel
              </span>
            </label>
            <Button variant="secondary" size="sm" onClick={exportGuestList}>
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button onClick={() => setShowAddGuest(true)}>
              <Plus className="w-4 h-4" />
              Add Guest
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search & Actions */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search guests..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-gold-500/50 focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              variant="secondary"
              onClick={sendAllInvites}
              loading={sendingInvites}
              disabled={stats.invited === stats.total}
            >
              <Send className="w-4 h-4" />
              Send All Invites ({stats.total - stats.invited})
            </Button>
          </div>

          {/* Add Guest Form */}
          {showAddGuest && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4"
            >
              <h4 className="font-medium text-white">Add New Guest</h4>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Name *"
                  value={newGuest.name}
                  onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                />
                <Input
                  placeholder="Phone Number *"
                  value={newGuest.phone}
                  onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                />
                <Input
                  placeholder="Email (optional)"
                  type="email"
                  value={newGuest.email}
                  onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                />
                <Input
                  placeholder="Plus Ones"
                  type="number"
                  value={newGuest.plus_ones}
                  onChange={(e) => setNewGuest({ ...newGuest, plus_ones: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowAddGuest(false)}>Cancel</Button>
                <Button onClick={addGuest}>Add Guest</Button>
              </div>
            </motion.div>
          )}

          {/* Guest List */}
          {filteredGuests.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">
                {searchTerm ? 'No guests found' : 'No guests added yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredGuests.map((guest) => (
                <motion.div
                  key={guest.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      guest.checked_in ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {guest.checked_in ? <CheckCircle2 className="w-5 h-5" /> : guest.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-white">{guest.name}</p>
                      <p className="text-sm text-gray-400 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {guest.phone}
                        </span>
                        {guest.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {guest.email}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Status badges */}
                    {guest.invitation_sent && (
                      <span className="px-2 py-1 rounded-full bg-gold-500/20 text-gold-400 text-xs">
                        Invited
                      </span>
                    )}
                    {guest.checked_in && (
                      <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
                        Checked In
                      </span>
                    )}
                    
                    {/* Actions */}
                    <Button variant="ghost" size="sm" onClick={() => downloadQRCode(guest)}>
                      <QrCode className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => sendWhatsAppInvite(guest)}
                      disabled={guest.invitation_sent}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => deleteGuest(guest.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

