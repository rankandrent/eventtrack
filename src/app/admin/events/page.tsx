'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase, Event } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Calendar, Users, MapPin, Plus, Trash2 } from 'lucide-react'
import { formatTime } from '@/lib/utils'
import { toast } from 'sonner'

export default function EventsPage() {
  const [events, setEvents] = useState<(Event & { guest_count?: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    loadEvents()
  }, [])

  async function loadEvents() {
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        setLoading(false)
        return
      }

      setUserId(session.user.id)

      // Load events for this user only
      const { data: eventsData, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', session.user.id)
        .order('event_date', { ascending: false })

      if (error) throw error

      // Get guest counts for each event
      const eventsWithCounts = await Promise.all(
        (eventsData || []).map(async (event) => {
          const { count } = await supabase
            .from('guests')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id)
          return { ...event, guest_count: count || 0 }
        })
      )

      setEvents(eventsWithCounts)
    } catch (error) {
      console.error('Error loading events:', error)
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  async function deleteEvent(id: string) {
    if (!confirm('Are you sure you want to delete this event? All guest data will be lost.')) {
      return
    }

    try {
      // First delete all guests for this event
      await supabase
        .from('guests')
        .delete()
        .eq('event_id', id)

      // Then delete the event
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setEvents(events.filter(e => e.id !== id))
      toast.success('Event deleted successfully')
    } catch (error) {
      console.error('Error deleting event:', error)
      toast.error('Failed to delete event')
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">My Events</h1>
          <p className="text-gray-400 mt-1">Manage all your events and their guests</p>
        </div>
        <Link href="/admin/events/new">
          <Button size="lg">
            <Plus className="w-5 h-5" />
            Create Event
          </Button>
        </Link>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <Card className="text-center py-16">
          <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No events yet</h3>
          <p className="text-gray-400 mb-6">Create your first event to start inviting guests</p>
          <Link href="/admin/events/new">
            <Button size="lg">
              <Plus className="w-5 h-5" />
              Create Your First Event
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, i) => {
            const eventDate = new Date(event.event_date)
            const isPast = eventDate < new Date()

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={`relative overflow-hidden ${isPast ? 'opacity-60' : ''}`}>
                  {/* Date Badge */}
                  <div className="absolute top-4 right-4 bg-midnight-900/80 backdrop-blur-sm rounded-lg p-2 text-center min-w-[60px]">
                    <div className="text-xs text-gold-400 uppercase">
                      {eventDate.toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {eventDate.getDate()}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white pr-20 line-clamp-2">
                        {event.name}
                      </h3>
                      {event.description && (
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="w-4 h-4 text-gold-400" />
                        <span>{formatTime(event.event_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <MapPin className="w-4 h-4 text-gold-400" />
                        <span className="line-clamp-1">{event.venue}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Users className="w-4 h-4 text-gold-400" />
                        <span>{event.guest_count} guests</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      <Link href={`/admin/events/${event.id}`} className="flex-1">
                        <Button variant="secondary" className="w-full">
                          View Details
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteEvent(event.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
