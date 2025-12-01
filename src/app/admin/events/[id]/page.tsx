'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, Event, Guest } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { generateInvitationImage } from '@/components/InvitationCard'
import { 
  ArrowLeft, Calendar, MapPin, Users, Send, QrCode, 
  CheckCircle2, Plus, Download, Upload, Trash2,
  Phone, Search, RefreshCw, Image, Share2, Shield, Link as LinkIcon,
  UserPlus, FileText, Zap, X, Play, Pause
} from 'lucide-react'
import { formatDate, formatTime, generateQRCode, formatPhone } from '@/lib/utils'
import { toast } from 'sonner'
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
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  const [sendingInvites, setSendingInvites] = useState(false)
  const [bulkSendProgress, setBulkSendProgress] = useState({ current: 0, total: 0, paused: false })
  const [generatingImage, setGeneratingImage] = useState<string | null>(null)
  const [newGuest, setNewGuest] = useState({ name: '', phone: '', email: '', plus_ones: '0' })
  const [bulkText, setBulkText] = useState('')
  const [autoSendOnAdd, setAutoSendOnAdd] = useState(false)

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
      
      const { data, error } = await supabase.from('guests').insert({
        event_id: eventId,
        name: newGuest.name,
        phone: formatPhone(newGuest.phone),
        email: newGuest.email || null,
        qr_code: qrCode,
        plus_ones: parseInt(newGuest.plus_ones) || 0,
      }).select().single()

      if (error) throw error

      setNewGuest({ name: '', phone: '', email: '', plus_ones: '0' })
      setShowAddGuest(false)
      toast.success('Guest added successfully')
      
      // Auto send if enabled
      if (autoSendOnAdd && data) {
        setTimeout(() => sendWhatsAppInvite(data), 500)
      }
      
      loadData()
    } catch (error) {
      console.error('Error adding guest:', error)
      toast.error('Failed to add guest')
    }
  }

  // Bulk add guests from text
  async function handleBulkAdd() {
    if (!bulkText.trim()) {
      toast.error('Please enter guest data')
      return
    }

    const lines = bulkText.trim().split('\n').filter(line => line.trim())
    let added = 0
    let errors = 0
    const newGuestsList: Guest[] = []

    for (const line of lines) {
      // Parse line - supports formats:
      // "Name, Phone" or "Name | Phone" or "Name\tPhone"
      const parts = line.split(/[,|\t]/).map(p => p.trim())
      
      if (parts.length >= 2) {
        const name = parts[0]
        const phone = parts[1]
        const email = parts[2] || null

        if (name && phone) {
          const qrCode = generateQRCode()
          const { data, error } = await supabase.from('guests').insert({
            event_id: eventId,
            name,
            phone: formatPhone(phone),
            email,
            qr_code: qrCode,
          }).select().single()

          if (!error && data) {
            added++
            newGuestsList.push(data)
          } else {
            errors++
          }
        }
      }
    }

    setBulkText('')
    setShowBulkAdd(false)
    loadData()

    if (added > 0) {
      toast.success(`Added ${added} guests${errors > 0 ? ` (${errors} failed)` : ''}`)
      
      // Auto send to all new guests if enabled
      if (autoSendOnAdd && newGuestsList.length > 0) {
        toast.info('Starting auto-send to new guests...')
        await bulkSendInvites(newGuestsList)
      }
    } else {
      toast.error('No guests added. Check format: Name, Phone')
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

  // Download invitation card with QR code
  async function downloadInvitationCard(guest: Guest) {
    if (!event) return
    
    setGeneratingImage(guest.id)
    try {
      const imageDataUrl = await generateInvitationImage(guest, event)
      
      const link = document.createElement('a')
      link.download = `invitation-${guest.name.replace(/\s+/g, '-').toLowerCase()}.png`
      link.href = imageDataUrl
      link.click()
      
      toast.success('Invitation card downloaded!')
    } catch (error) {
      console.error('Error generating invitation:', error)
      toast.error('Failed to generate invitation card')
    } finally {
      setGeneratingImage(null)
    }
  }

  // Send WhatsApp with invitation link
  async function sendWhatsAppInvite(guest: Guest, updateDb = true) {
    if (!event) return
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const invitationUrl = `${appUrl}/invitation/${guest.qr_code}`

    const message = `🎉 *${event.name}*

Dear ${guest.name}, you're invited!

📥 *View & Download Your Invitation:*
${invitationUrl}

Click the link above to see event details and download your QR code.`

    const whatsappUrl = `https://wa.me/${guest.phone}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')

    if (updateDb) {
      await supabase.from('guests').update({
        invitation_sent: true,
        invitation_sent_at: new Date().toISOString()
      }).eq('id', guest.id)

      await supabase.from('whatsapp_logs').insert({
        guest_id: guest.id,
        event_id: eventId,
        message_type: 'invitation',
        status: 'sent',
        sent_at: new Date().toISOString()
      })

      loadData()
    }
  }

  // Share invitation with image (mobile)
  async function shareWithImage(guest: Guest) {
    if (!event) return
    
    setGeneratingImage(guest.id)
    try {
      const imageDataUrl = await generateInvitationImage(guest, event)
      
      if (navigator.share && navigator.canShare) {
        const response = await fetch(imageDataUrl)
        const blob = await response.blob()
        const file = new File([blob], `invitation-${guest.name}.png`, { type: 'image/png' })
        
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
        const invitationUrl = `${appUrl}/invitation/${guest.qr_code}`
        
        const shareData = {
          title: `Invitation: ${event.name}`,
          text: `You're invited to ${event.name}!\n\nDownload link: ${invitationUrl}`,
          files: [file]
        }
        
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData)
          
          await supabase.from('guests').update({
            invitation_sent: true,
            invitation_sent_at: new Date().toISOString()
          }).eq('id', guest.id)

          toast.success('Invitation shared!')
          loadData()
        }
      } else {
        downloadInvitationCard(guest)
        setTimeout(() => sendWhatsAppInvite(guest), 500)
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast.error('Failed to share')
      }
    } finally {
      setGeneratingImage(null)
    }
  }

  // Bulk send invites with progress
  async function bulkSendInvites(guestList?: Guest[]) {
    const uninvited = guestList || guests.filter(g => !g.invitation_sent)
    
    if (uninvited.length === 0) {
      toast.info('All invitations have been sent')
      return
    }

    setSendingInvites(true)
    setBulkSendProgress({ current: 0, total: uninvited.length, paused: false })

    for (let i = 0; i < uninvited.length; i++) {
      // Check if paused
      if (bulkSendProgress.paused) {
        toast.info('Bulk send paused')
        break
      }

      const guest = uninvited[i]
      setBulkSendProgress(prev => ({ ...prev, current: i + 1 }))
      
      await sendWhatsAppInvite(guest)
      
      // Wait between sends to avoid rate limiting
      if (i < uninvited.length - 1) {
        await new Promise(r => setTimeout(r, 2000))
      }
    }

    setSendingInvites(false)
    setBulkSendProgress({ current: 0, total: 0, paused: false })
    toast.success(`Sent ${uninvited.length} invitations!`)
  }

  function pauseBulkSend() {
    setBulkSendProgress(prev => ({ ...prev, paused: true }))
  }

  // Copy scanner link for gate staff
  function copyScannerLink() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const scannerUrl = `${appUrl}/scanner/${eventId}`
    navigator.clipboard.writeText(scannerUrl)
    toast.success('Scanner link copied! Share with gate staff')
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
      const newGuestsList: Guest[] = []
      
      for (const row of jsonData) {
        const name = row.Name || row.name || row.NAME
        const phone = row.Phone || row.phone || row.PHONE || row.Mobile || row.mobile
        const email = row.Email || row.email || row.EMAIL

        if (name && phone) {
          const qrCode = generateQRCode()
          const { data, error } = await supabase.from('guests').insert({
            event_id: eventId,
            name: String(name).trim(),
            phone: formatPhone(String(phone)),
            email: email ? String(email).trim() : null,
            qr_code: qrCode,
          }).select().single()
          
          if (!error && data) {
            added++
            newGuestsList.push(data)
          }
        }
      }

      toast.success(`Added ${added} guests from Excel`)
      loadData()
      
      // Auto send if enabled
      if (autoSendOnAdd && newGuestsList.length > 0) {
        toast.info('Starting auto-send to new guests...')
        await bulkSendInvites(newGuestsList)
      }
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
    <div className="space-y-4 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3 md:gap-4">
          <Link href="/admin/events">
            <Button variant="ghost" size="sm" className="mt-1">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-display font-bold text-white truncate">{event.name}</h1>
            <p className="text-gray-400 text-xs md:text-sm flex flex-wrap items-center gap-1 md:gap-2">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                {formatDate(event.event_date)}
              </span>
              <span className="text-gray-600">•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 md:w-4 md:h-4" />
                {event.venue}
              </span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={copyScannerLink} className="text-xs md:text-sm">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Copy Scanner Link</span>
            <span className="sm:hidden">Scanner</span>
          </Button>
          <Link href={`/scanner/${event.id}`}>
            <Button className="text-xs md:text-sm">
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">Open Scanner</span>
              <span className="sm:hidden">Scan</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        {[
          { label: 'Total', value: stats.total, icon: Users, color: 'text-blue-400' },
          { label: 'Invited', value: stats.invited, icon: Send, color: 'text-gold-400' },
          { label: 'Checked In', value: stats.checkedIn, icon: CheckCircle2, color: 'text-green-400' },
        ].map((stat) => (
          <Card key={stat.label} className="p-3 md:p-6">
            <CardContent className="flex flex-col md:flex-row items-center gap-1 md:gap-3 p-0 text-center md:text-left">
              <stat.icon className={`w-5 h-5 md:w-8 md:h-8 ${stat.color}`} />
              <div>
                <p className="text-lg md:text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-[10px] md:text-sm text-gray-400">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bulk Send Progress */}
      <AnimatePresence>
        {sendingInvites && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-gold-500/30 bg-gold-500/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Send className="w-5 h-5 text-gold-400 animate-pulse" />
                    <span className="text-white font-medium">
                      Sending invitations... {bulkSendProgress.current}/{bulkSendProgress.total}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={pauseBulkSend}>
                    <Pause className="w-4 h-4" />
                    Pause
                  </Button>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(bulkSendProgress.current / bulkSendProgress.total) * 100}%` }}
                    className="h-full bg-gradient-to-r from-gold-500 to-gold-600"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guest Management */}
      <Card>
        <CardHeader className="space-y-3 md:space-y-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg md:text-xl">Guest List</CardTitle>
              <CardDescription className="text-xs md:text-sm">Add guests and send invitation links with QR codes</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Auto-send toggle */}
              <button
                onClick={() => setAutoSendOnAdd(!autoSendOnAdd)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  autoSendOnAdd 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                }`}
              >
                <Zap className="w-3 h-3" />
                Auto-Send
              </button>
              
              <label className="cursor-pointer">
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelUpload} />
                <span className="inline-flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-lg md:rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all cursor-pointer">
                  <Upload className="w-3 h-3 md:w-4 md:h-4" />
                  Excel
                </span>
              </label>
              <Button variant="secondary" size="sm" onClick={() => setShowBulkAdd(true)} className="text-xs md:text-sm">
                <FileText className="w-3 h-3 md:w-4 md:h-4" />
                Bulk
              </Button>
              <Button onClick={() => setShowAddGuest(true)} size="sm" className="text-xs md:text-sm">
                <Plus className="w-3 h-3 md:w-4 md:h-4" />
                Add
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search & Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search guests..."
                className="w-full pl-10 pr-4 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-gold-500/50 focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={exportGuestList} className="text-xs">
                <Download className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => bulkSendInvites()}
                loading={sendingInvites}
                disabled={stats.invited === stats.total}
                className="text-xs md:text-sm whitespace-nowrap flex-1 sm:flex-initial"
              >
                <Send className="w-3 h-3 md:w-4 md:h-4" />
                Send All ({stats.total - stats.invited})
              </Button>
            </div>
          </div>

          {/* Bulk Add Form */}
          <AnimatePresence>
            {showBulkAdd && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-white flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-gold-400" />
                    Bulk Add Guests
                  </h4>
                  <button onClick={() => setShowBulkAdd(false)} className="text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs text-gray-400">
                    Paste guests below. Format: <code className="bg-white/10 px-1 rounded">Name, Phone</code> (one per line)
                  </p>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-gold-500/50 focus:outline-none min-h-[150px] font-mono text-sm"
                    placeholder={`Ahmed Khan, 923001234567
Sara Ali, 14155551234
Muhammad Umar, 923009876543`}
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Tip: Copy from Excel/Google Sheets and paste directly
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-400">
                    <input
                      type="checkbox"
                      checked={autoSendOnAdd}
                      onChange={(e) => setAutoSendOnAdd(e.target.checked)}
                      className="rounded border-white/20 bg-white/5 text-gold-500 focus:ring-gold-500"
                    />
                    <Zap className="w-4 h-4" />
                    Auto-send invitations after adding
                  </label>
                  <Button onClick={handleBulkAdd}>
                    <UserPlus className="w-4 h-4" />
                    Add Guests
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Add Guest Form */}
          <AnimatePresence>
            {showAddGuest && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 md:p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 md:space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-white text-sm md:text-base">Add New Guest</h4>
                  <button onClick={() => setShowAddGuest(false)} className="text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    placeholder="Name *"
                    value={newGuest.name}
                    onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                    className="text-sm"
                  />
                  <Input
                    placeholder="Phone with country code (e.g. 14155551234)"
                    value={newGuest.phone}
                    onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                    className="text-sm"
                  />
                  <Input
                    placeholder="Email (optional)"
                    type="email"
                    value={newGuest.email}
                    onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                    className="text-sm"
                  />
                  <Input
                    placeholder="Plus Ones"
                    type="number"
                    value={newGuest.plus_ones}
                    onChange={(e) => setNewGuest({ ...newGuest, plus_ones: e.target.value })}
                    className="text-sm"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-400">
                    <input
                      type="checkbox"
                      checked={autoSendOnAdd}
                      onChange={(e) => setAutoSendOnAdd(e.target.checked)}
                      className="rounded border-white/20 bg-white/5 text-gold-500 focus:ring-gold-500"
                    />
                    <Zap className="w-4 h-4" />
                    Auto-send invitation
                  </label>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowAddGuest(false)}>Cancel</Button>
                    <Button size="sm" onClick={addGuest}>Add Guest</Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Guest List */}
          {filteredGuests.length === 0 ? (
            <div className="text-center py-8 md:py-12">
              <Users className="w-10 h-10 md:w-12 md:h-12 text-gray-600 mx-auto mb-3 md:mb-4" />
              <p className="text-gray-400 text-sm md:text-base">
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
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 md:p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm md:text-base ${
                      guest.checked_in ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {guest.checked_in ? <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" /> : guest.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-white text-sm md:text-base truncate">{guest.name}</p>
                      <p className="text-xs md:text-sm text-gray-400 flex items-center gap-2 md:gap-3">
                        <span className="flex items-center gap-1 truncate">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          {guest.phone}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 justify-between sm:justify-end">
                    {/* Status badges */}
                    <div className="flex items-center gap-1">
                      {guest.invitation_sent && (
                        <span className="px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-400 text-[10px] md:text-xs">
                          Invited
                        </span>
                      )}
                      {guest.checked_in && (
                        <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] md:text-xs">
                          Checked In
                        </span>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => downloadInvitationCard(guest)} 
                        className="p-2"
                        title="Download Invitation Card"
                        disabled={generatingImage === guest.id}
                      >
                        {generatingImage === guest.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Image className="w-4 h-4" />
                        )}
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => shareWithImage(guest)}
                        className="p-2 text-green-400 hover:text-green-300"
                        title="Share with QR Image"
                        disabled={generatingImage === guest.id}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => sendWhatsAppInvite(guest)}
                        className="p-2"
                        title="Send Invitation Link via WhatsApp"
                      >
                        <LinkIcon className="w-4 h-4" />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => deleteGuest(guest.id)}
                        className="text-red-400 hover:text-red-300 p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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
