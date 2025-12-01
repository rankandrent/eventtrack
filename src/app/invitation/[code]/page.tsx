'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase, Guest, Event } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { generateInvitationImage } from '@/components/InvitationCard'
import { 
  QrCode, Calendar, Clock, MapPin, User, 
  CheckCircle2, Sparkles, Download, Share2
} from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'
import QRCodeLib from 'qrcode'

export default function InvitationDownloadPage() {
  const params = useParams()
  const code = params.code as string
  
  const [guest, setGuest] = useState<Guest | null>(null)
  const [event, setEvent] = useState<Event | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
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

      // Generate QR code for display - Always use production URL
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://invite-event.netlify.app'
      const checkInUrl = `${appUrl}/checkin?code=${code}`
      
      const qrUrl = await QRCodeLib.toDataURL(checkInUrl, {
        width: 280,
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

  async function downloadInvitationCard() {
    if (!guest || !event) return
    
    setDownloading(true)
    try {
      const imageDataUrl = await generateInvitationImage(guest, event)
      
      const link = document.createElement('a')
      link.download = `invitation-${guest.name.replace(/\s+/g, '-').toLowerCase()}.png`
      link.href = imageDataUrl
      link.click()
    } catch (error) {
      console.error('Error downloading:', error)
    } finally {
      setDownloading(false)
    }
  }

  async function shareInvitation() {
    if (!guest || !event) return

    setDownloading(true)
    try {
      const imageDataUrl = await generateInvitationImage(guest, event)
      
      if (navigator.share && navigator.canShare) {
        const response = await fetch(imageDataUrl)
        const blob = await response.blob()
        const file = new File([blob], `invitation-${guest.name}.png`, { type: 'image/png' })
        
        const shareData = {
          title: `Invitation: ${event.name}`,
          text: `My invitation to ${event.name}`,
          files: [file]
        }
        
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData)
        }
      } else {
        // Fallback - download
        downloadInvitationCard()
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing:', error)
      }
    } finally {
      setDownloading(false)
    }
  }

  function addToCalendar() {
    if (!event) return

    const startDate = new Date(event.event_date)
    const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000)

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
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="text-center max-w-md">
          <div className="p-8 space-y-4">
            <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
              <QrCode className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-xl font-display font-bold text-white">
              Invitation Not Found
            </h1>
            <p className="text-gray-400">
              This invitation link is invalid or has expired.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 md:py-12 px-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-500/10 border border-gold-500/20 mb-4">
            <Sparkles className="w-4 h-4 text-gold-400" />
            <span className="text-gold-300 text-sm font-medium">You&apos;re Invited!</span>
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
                <span className="text-gold-300 text-sm">Dear</span>
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

                <div className="space-y-3">
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
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-400">
                  Show this QR code at the entrance
                </p>
                
                <div className="inline-block p-4 bg-white rounded-2xl shadow-xl">
                  {qrDataUrl && (
                    <img 
                      src={qrDataUrl} 
                      alt="Check-in QR Code" 
                      className="w-56 h-56"
                    />
                  )}
                </div>

                <p className="text-xs text-gray-500 font-mono">
                  {guest?.qr_code}
                </p>
              </div>

              {/* Download & Share Buttons */}
              <div className="space-y-3">
                <Button 
                  onClick={downloadInvitationCard} 
                  className="w-full" 
                  size="lg"
                  loading={downloading}
                >
                  <Download className="w-5 h-5" />
                  Download Invitation Card
                </Button>
                
                <Button 
                  onClick={shareInvitation} 
                  variant="secondary" 
                  className="w-full"
                  loading={downloading}
                >
                  <Share2 className="w-5 h-5" />
                  Share
                </Button>

                <Button onClick={addToCalendar} variant="ghost" className="w-full">
                  <Calendar className="w-4 h-4" />
                  Add to Calendar
                </Button>
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

