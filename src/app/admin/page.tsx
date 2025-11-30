'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase, Event, Guest } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Calendar, Users, CheckCircle2, Send, Plus, ArrowRight } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'

export default function AdminDashboard() {
  const [events, setEvents] = useState<Event[]>([])
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalGuests: 0,
    checkedIn: 0,
    invitationsSent: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      // Load events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true })
        .limit(5)

      setEvents(eventsData || [])

      // Load stats
      const { count: eventCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })

      const { count: guestCount } = await supabase
        .from('guests')
        .select('*', { count: 'exact', head: true })

      const { count: checkedInCount } = await supabase
        .from('guests')
        .select('*', { count: 'exact', head: true })
        .eq('checked_in', true)

      const { count: sentCount } = await supabase
        .from('guests')
        .select('*', { count: 'exact', head: true })
        .eq('invitation_sent', true)

      setStats({
        totalEvents: eventCount || 0,
        totalGuests: guestCount || 0,
        checkedIn: checkedInCount || 0,
        invitationsSent: sentCount || 0,
      })
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: 'Total Events', value: stats.totalEvents, icon: Calendar, color: 'from-blue-500 to-blue-600' },
    { label: 'Total Guests', value: stats.totalGuests, icon: Users, color: 'from-purple-500 to-purple-600' },
    { label: 'Checked In', value: stats.checkedIn, icon: CheckCircle2, color: 'from-green-500 to-green-600' },
    { label: 'Invites Sent', value: stats.invitationsSent, icon: Send, color: 'from-gold-500 to-gold-600' },
  ]

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1 text-sm md:text-base">Welcome back! Here&apos;s your event overview.</p>
        </div>
        <Link href="/admin/events/new" className="w-full sm:w-auto">
          <Button size="lg" className="w-full sm:w-auto">
            <Plus className="w-5 h-5" />
            Create Event
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="p-3 md:p-6">
              <CardContent className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 p-0">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center flex-shrink-0`}>
                  <stat.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs md:text-sm">{stat.label}</p>
                  <p className="text-xl md:text-2xl font-bold text-white">
                    {loading ? '...' : stat.value.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-lg md:text-xl">Upcoming Events</CardTitle>
          <Link href="/admin/events">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3 md:space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 md:h-20 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 md:py-12">
              <Calendar className="w-10 h-10 md:w-12 md:h-12 text-gray-600 mx-auto mb-3 md:mb-4" />
              <p className="text-gray-400 mb-4 text-sm md:text-base">No events yet</p>
              <Link href="/admin/events/new">
                <Button>Create Your First Event</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/admin/events/${event.id}`}
                  className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-gold-500/30 transition-all group"
                >
                  <div className="flex items-center gap-3 md:gap-4 min-w-0">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-gradient-to-br from-gold-500/20 to-gold-600/20 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[10px] md:text-xs text-gold-400 uppercase">
                        {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-base md:text-lg font-bold text-gold-300">
                        {new Date(event.event_date).getDate()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-white group-hover:text-gold-400 transition-colors text-sm md:text-base truncate">
                        {event.name}
                      </h4>
                      <p className="text-xs md:text-sm text-gray-400 truncate">
                        {formatTime(event.event_date)} • {event.venue}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-gray-600 group-hover:text-gold-400 transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
