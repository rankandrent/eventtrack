'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft, Calendar, MapPin, User, Phone, Image } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function NewEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    event_date: '',
    event_time: '',
    venue: '',
    venue_address: '',
    host_name: '',
    host_phone: '',
    max_guests: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!form.name || !form.event_date || !form.event_time || !form.venue) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)

    try {
      const eventDateTime = new Date(`${form.event_date}T${form.event_time}`)
      
      const { data, error } = await supabase
        .from('events')
        .insert({
          name: form.name,
          description: form.description || null,
          event_date: eventDateTime.toISOString(),
          venue: form.venue,
          venue_address: form.venue_address || null,
          host_name: form.host_name || null,
          host_phone: form.host_phone || null,
          max_guests: form.max_guests ? parseInt(form.max_guests) : null,
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Event created successfully!')
      router.push(`/admin/events/${data.id}`)
    } catch (error) {
      console.error('Error creating event:', error)
      toast.error('Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/events">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Create New Event</h1>
          <p className="text-gray-400 text-sm">Set up your event details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>
              Enter the basic information about your event
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Event Name */}
            <Input
              label="Event Name *"
              placeholder="e.g., Annual Gala Dinner 2024"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Description
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-gold-500/50 focus:ring-2 focus:ring-gold-500/20 transition-all min-h-[100px] resize-none"
                placeholder="Tell your guests about the event..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Date *
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-gold-500/50 focus:ring-2 focus:ring-gold-500/20 transition-all"
                  value={form.event_date}
                  onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Time *
                </label>
                <input
                  type="time"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-gold-500/50 focus:ring-2 focus:ring-gold-500/20 transition-all"
                  value={form.event_time}
                  onChange={(e) => setForm({ ...form, event_time: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Venue */}
            <Input
              label="Venue Name *"
              placeholder="e.g., Grand Ballroom, Marriott Hotel"
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              required
            />

            {/* Venue Address */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                <MapPin className="w-4 h-4 inline mr-2" />
                Venue Address
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-gold-500/50 focus:ring-2 focus:ring-gold-500/20 transition-all min-h-[80px] resize-none"
                placeholder="Full address for the venue..."
                value={form.venue_address}
                onChange={(e) => setForm({ ...form, venue_address: e.target.value })}
              />
            </div>

            {/* Host Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  <User className="w-4 h-4 inline mr-2" />
                  Host Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-gold-500/50 focus:ring-2 focus:ring-gold-500/20 transition-all"
                  placeholder="Your name"
                  value={form.host_name}
                  onChange={(e) => setForm({ ...form, host_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Host Phone
                </label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-gold-500/50 focus:ring-2 focus:ring-gold-500/20 transition-all"
                  placeholder="e.g. +1 415 555 1234"
                  value={form.host_phone}
                  onChange={(e) => setForm({ ...form, host_phone: e.target.value })}
                />
              </div>
            </div>

            {/* Max Guests */}
            <Input
              label="Maximum Guests (optional)"
              type="number"
              placeholder="e.g., 200"
              value={form.max_guests}
              onChange={(e) => setForm({ ...form, max_guests: e.target.value })}
            />

            {/* Submit */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/5">
              <Link href="/admin/events">
                <Button variant="ghost">Cancel</Button>
              </Link>
              <Button type="submit" loading={loading}>
                Create Event
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

