'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase, Event, Guest, CheckinLog } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { 
  BarChart3, Users, CheckCircle2, Send, Calendar, 
  TrendingUp, Clock, MapPin, Activity
} from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'

export default function AnalyticsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [checkinLogs, setCheckinLogs] = useState<CheckinLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()

    // Real-time updates
    const channel = supabase
      .channel('analytics-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guests' }, loadAnalytics)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checkin_logs' }, loadAnalytics)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function loadAnalytics() {
    try {
      const [eventsRes, guestsRes, logsRes] = await Promise.all([
        supabase.from('events').select('*').order('event_date', { ascending: false }),
        supabase.from('guests').select('*'),
        supabase.from('checkin_logs').select('*').order('created_at', { ascending: false }).limit(50)
      ])

      setEvents(eventsRes.data || [])
      setGuests(guestsRes.data || [])
      setCheckinLogs(logsRes.data || [])
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate stats
  const totalGuests = guests.length
  const checkedInGuests = guests.filter(g => g.checked_in).length
  const invitationsSent = guests.filter(g => g.invitation_sent).length
  const checkInRate = totalGuests > 0 ? Math.round((checkedInGuests / totalGuests) * 100) : 0
  const inviteRate = totalGuests > 0 ? Math.round((invitationsSent / totalGuests) * 100) : 0

  // Group check-ins by hour
  const checkInsByHour = checkinLogs
    .filter(log => log.success)
    .reduce((acc, log) => {
      const hour = new Date(log.created_at).getHours()
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    }, {} as Record<number, number>)

  // Get event-specific stats
  const eventStats = events.map(event => {
    const eventGuests = guests.filter(g => g.event_id === event.id)
    return {
      ...event,
      totalGuests: eventGuests.length,
      checkedIn: eventGuests.filter(g => g.checked_in).length,
      invited: eventGuests.filter(g => g.invitation_sent).length,
    }
  })

  // Recent activity
  const recentActivity = checkinLogs.slice(0, 10).map(log => {
    const guest = guests.find(g => g.id === log.guest_id)
    const event = events.find(e => e.id === log.event_id)
    return { ...log, guest, event }
  })

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
      <div>
        <h1 className="text-3xl font-display font-bold text-white">Analytics</h1>
        <p className="text-gray-400 mt-1">Real-time insights across all your events</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Events', value: events.length, icon: Calendar, color: 'from-blue-500 to-blue-600' },
          { label: 'Total Guests', value: totalGuests, icon: Users, color: 'from-purple-500 to-purple-600' },
          { label: 'Checked In', value: `${checkedInGuests} (${checkInRate}%)`, icon: CheckCircle2, color: 'from-green-500 to-green-600' },
          { label: 'Invites Sent', value: `${invitationsSent} (${inviteRate}%)`, icon: Send, color: 'from-gold-500 to-gold-600' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardContent className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Event Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gold-400" />
              Event Performance
            </CardTitle>
            <CardDescription>Check-in rates by event</CardDescription>
          </CardHeader>
          <CardContent>
            {eventStats.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No events yet</p>
            ) : (
              <div className="space-y-4">
                {eventStats.slice(0, 5).map((event) => {
                  const rate = event.totalGuests > 0 
                    ? Math.round((event.checkedIn / event.totalGuests) * 100) 
                    : 0

                  return (
                    <div key={event.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium text-sm">{event.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatDate(event.event_date)}
                          </p>
                        </div>
                        <span className="text-sm text-gray-400">
                          {event.checkedIn}/{event.totalGuests}
                        </span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${rate}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-gold-500 to-gold-600 rounded-full"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Check-in Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gold-400" />
              Check-in Distribution
            </CardTitle>
            <CardDescription>When guests check in (by hour)</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(checkInsByHour).length === 0 ? (
              <p className="text-gray-500 text-center py-8">No check-ins yet</p>
            ) : (
              <div className="flex items-end gap-1 h-32">
                {Array.from({ length: 24 }, (_, i) => {
                  const count = checkInsByHour[i] || 0
                  const maxCount = Math.max(...Object.values(checkInsByHour))
                  const height = maxCount > 0 ? (count / maxCount) * 100 : 0

                  return (
                    <div
                      key={i}
                      className="flex-1 group relative"
                    >
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ duration: 0.5, delay: i * 0.02 }}
                        className="bg-gradient-to-t from-gold-600 to-gold-400 rounded-t"
                        style={{ minHeight: count > 0 ? '4px' : '0' }}
                      />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="bg-midnight-800 border border-white/10 rounded px-2 py-1 text-xs whitespace-nowrap">
                          {i}:00 - {count} check-ins
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>12 AM</span>
              <span>6 AM</span>
              <span>12 PM</span>
              <span>6 PM</span>
              <span>12 AM</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-gold-400" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest check-in attempts</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No activity yet</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {activity.success ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span className="text-xs">✕</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-white">
                        {activity.guest?.name || 'Unknown Guest'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {activity.event?.name || 'Unknown Event'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs ${activity.success ? 'text-green-400' : 'text-red-400'}`}>
                      {activity.success ? 'Checked In' : activity.failure_reason}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTime(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

