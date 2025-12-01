'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase, Guest, Event } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  QrCode, Calendar, Clock, MapPin, User, 
  CheckCircle2, Sparkles, ExternalLink
} from 'lucide-react'
import { formatDate, formatTime, getAppUrl } from '@/lib/utils'
import QRCode from 'qrcode'

export default function InvitePage() {
  const params = useParams()
  const code = params.code as string
  
  const [guest, setGuest] = useState<Guest | null>(null)
  const [event, setEvent] = useState<Event | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    loadInvitation()
  }, [code])

  async function loadInvitation() {
    try {
      // Find guest by QR code
      const { data: guestData, error: guestError } = await supabase
        .from('guests')
        .select('*')
        .eq('qr_code', code)
        .single()

      if (guestError || !guestData) {
        setNotFound(true)
        return
      }

      setGuest(guestData)

      // Load event
      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('id', guestData.event_id)
        .single()

      setEvent(eventData)

      // Generate QR code - Always use production URL
      const appUrl = getAppUrl()
      const checkInUrl = `${appUrl}/checkin?code=${code}`
      
      const qrUrl = await QRCode.toDataURL(checkInUrl, {
        width: 300,
        margin: 2,
        color: { dark: '#0d1f38', light: '#ffffff' }
      })
      setQrDataUrl(qrUrl)

    } catch (error) {
      console.error('Error loading invitation:', error)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  function openGoogleMaps() {
    if (event?.venue_address) {
      const query = encodeURIComponent(event.venue_address)
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank')
    }
  }

  function addToCalendar() {
    if (!event) return

    const startDate = new Date(event.event_date)
    const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000) // Assume 3 hours

    const formatDateForCal = (date: Date) => 
      date.toISOString().replace(/-|:|\.\d+/g, '').slice(0, -1)

    const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.name)}&dates=${formatDateForCal(startDate)}/${formatDateForCal(endDate)}&location=${encodeURIComponent(event.venue + (event.venue_address ? ', ' + event.venue_address : ''))}`
    
    window.open(calUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="text-center max-w-md">
          <div className="p-8 space-y-4">
            <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
              <QrCode className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-xl font-display font-bold text-white">
              Invitation Not Found
            </h1>
            <p className="text-gray-400">
              This invitation link is invalid or has expired. Please contact the event host.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-500/10 border border-gold-500/20 mb-4">
            <Sparkles className="w-4 h-4 text-gold-400" />
            <span className="text-gold-300 text-sm font-medium">You&apos;re Invited</span>
          </div>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="overflow-hidden">
            {/* Guest Welcome */}
            <div className="bg-gradient-to-r from-gold-500/20 to-gold-600/20 p-6 text-center border-b border-gold-500/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <User className="w-5 h-5 text-gold-400" />
                <span className="text-gold-300 text-sm">Welcome</span>
              </div>
              <h1 className="text-2xl font-display font-bold text-white">
                {guest?.name}
              </h1>
              {guest?.checked_in && (
                <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Already Checked In
                </div>
              )}
            </div>

            {/* Event Info */}
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-display font-bold gold-text text-center mb-6">
                  {event?.name}
                </h2>

                {event?.description && (
                  <p className="text-gray-400 text-sm text-center mb-6">
                    {event.description}
                  </p>
                )}

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                    <Calendar className="w-5 h-5 text-gold-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-400">Date</p>
                      <p className="text-white font-medium">
                        {formatDate(event?.event_date || '')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                    <Clock className="w-5 h-5 text-gold-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-400">Time</p>
                      <p className="text-white font-medium">
                        {formatTime(event?.event_date || '')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                    <MapPin className="w-5 h-5 text-gold-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-400">Venue</p>
                      <p className="text-white font-medium">{event?.venue}</p>
                      {event?.venue_address && (
                        <p className="text-gray-400 text-sm mt-1">{event.venue_address}</p>
                      )}
                    </div>
                    {event?.venue_address && (
                      <button
                        onClick={openGoogleMaps}
                        className="text-gold-400 hover:text-gold-300 transition-colors"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-400">
                  Show this QR code at the entrance
                </p>
                
                <div className="inline-block p-4 bg-white rounded-2xl">
                  {qrDataUrl && (
                    <img 
                      src={qrDataUrl} 
                      alt="Check-in QR Code" 
                      className="w-48 h-48"
                    />
                  )}
                </div>

                <p className="text-xs text-gray-500">
                  Code: {guest?.qr_code}
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button onClick={addToCalendar} variant="secondary" className="w-full">
                  <Calendar className="w-4 h-4" />
                  Add to Calendar
                </Button>
                
                {event?.venue_address && (
                  <Button onClick={openGoogleMaps} variant="ghost" className="w-full">
                    <MapPin className="w-4 h-4" />
                    Get Directions
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Host Info */}
        {event?.host_name && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center text-sm text-gray-500"
          >
            Hosted by {event.host_name}
          </motion.div>
        )}
      </div>
    </div>
  )
}

