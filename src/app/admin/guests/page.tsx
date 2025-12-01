'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase, Guest, Event } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  Users, Search, CheckCircle2, Send, Phone, Mail, 
  Calendar, Download, Filter, RefreshCw
} from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

export default function GuestsPage() {
  const [guests, setGuests] = useState<(Guest & { event?: Event })[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEvent, setFilterEvent] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      // Current user
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        setGuests([])
        setEvents([])
        return
      }

      // Load only this user's events
      const { data: eventsRes, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', session.user.id)
        .order('event_date', { ascending: false })

      if (eventsError) throw eventsError

      const eventIds = (eventsRes || []).map(e => e.id)

      // If user has no events, no guests
      let guestsRes: { data: Guest[] | null } = { data: [] }
      if (eventIds.length > 0) {
        const res = await supabase
          .from('guests')
          .select('*')
          .in('event_id', eventIds)
          .order('created_at', { ascending: false })
        guestsRes = { data: res.data || [] }
      }

      const eventsMap = new Map((eventsRes || []).map(e => [e.id, e]))
      const guestsWithEvents = (guestsRes.data || []).map(g => ({
        ...g,
        event: eventsMap.get(g.event_id)
      }))

      setGuests(guestsWithEvents)
      setEvents(eventsRes || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const filteredGuests = guests.filter(guest => {
    const matchesSearch = 
      guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.phone.includes(searchTerm) ||
      guest.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesEvent = filterEvent === 'all' || guest.event_id === filterEvent
    
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'checked_in' && guest.checked_in) ||
      (filterStatus === 'pending' && !guest.checked_in) ||
      (filterStatus === 'invited' && guest.invitation_sent) ||
      (filterStatus === 'not_invited' && !guest.invitation_sent)

    return matchesSearch && matchesEvent && matchesStatus
  })

  const stats = {
    total: filteredGuests.length,
    checkedIn: filteredGuests.filter(g => g.checked_in).length,
    invited: filteredGuests.filter(g => g.invitation_sent).length,
  }

  function exportGuests() {
    const exportData = filteredGuests.map(g => ({
      Name: g.name,
      Phone: g.phone,
      Email: g.email || '',
      Event: g.event?.name || '',
      'QR Code': g.qr_code,
      'Invitation Sent': g.invitation_sent ? 'Yes' : 'No',
      'Invitation Date': g.invitation_sent_at ? new Date(g.invitation_sent_at).toLocaleString() : '',
      'Checked In': g.checked_in ? 'Yes' : 'No',
      'Check-in Time': g.checked_in_at ? new Date(g.checked_in_at).toLocaleString() : '',
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Guests')
    XLSX.writeFile(wb, 'all-guests.xlsx')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">All Guests</h1>
          <p className="text-gray-400 mt-1">View and manage guests across all events</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={loadData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="secondary" onClick={exportGuests}>
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-sm text-gray-400">Total Guests</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <Send className="w-8 h-8 text-gold-400" />
            <div>
              <p className="text-2xl font-bold text-white">{stats.invited}</p>
              <p className="text-sm text-gray-400">Invites Sent</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-2xl font-bold text-white">{stats.checkedIn}</p>
              <p className="text-sm text-gray-400">Checked In</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-gold-500/50 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Event Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-gold-500/50 focus:outline-none"
              value={filterEvent}
              onChange={(e) => setFilterEvent(e.target.value)}
            >
              <option value="all">All Events</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-gold-500/50 focus:outline-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="checked_in">Checked In</option>
              <option value="pending">Not Checked In</option>
              <option value="invited">Invitation Sent</option>
              <option value="not_invited">Not Invited</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Guest List */}
      <Card>
        <CardHeader>
          <CardTitle>Guests ({filteredGuests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredGuests.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No guests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Guest</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Contact</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Event</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Status</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Check-in</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGuests.map((guest, i) => (
                    <motion.tr
                      key={guest.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-white/5 hover:bg-white/5"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            guest.checked_in ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {guest.checked_in ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              guest.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span className="font-medium text-white">{guest.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {guest.phone}
                          </p>
                          {guest.email && (
                            <p className="text-sm text-gray-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {guest.email}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-300">
                          {guest.event?.name || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {guest.invitation_sent ? (
                          <span className="px-2 py-1 rounded-full bg-gold-500/20 text-gold-400 text-xs">
                            Invited
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full bg-gray-500/20 text-gray-400 text-xs">
                            Not Invited
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {guest.checked_in ? (
                          <div>
                            <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
                              Checked In
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTime(guest.checked_in_at!)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">—</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

