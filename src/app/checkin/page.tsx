'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, Guest, Event } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  QrCode, CheckCircle2, XCircle, Camera, RefreshCw, 
  User, Calendar, MapPin, ArrowLeft
} from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'
import Link from 'next/link'

type ScanResult = {
  status: 'success' | 'already_checked' | 'invalid' | null
  guest?: Guest
  event?: Event
  message?: string
}

function CheckinPageContent() {
  const searchParams = useSearchParams()
  const codeFromUrl = searchParams.get('code')
  const eventIdFromUrl = searchParams.get('event')

  const [scanning, setScanning] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [scanResult, setScanResult] = useState<ScanResult>({ status: null })
  const [loading, setLoading] = useState(false)
  const [event, setEvent] = useState<Event | null>(null)
  const [stats, setStats] = useState({ total: 0, checkedIn: 0 })

  // Load event if specified
  const loadEvent = useCallback(async () => {
    if (eventIdFromUrl) {
      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventIdFromUrl)
        .single()
      
      if (eventData) setEvent(eventData)

      // Load stats
      const { count: total } = await supabase
        .from('guests')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventIdFromUrl)

      const { count: checkedIn } = await supabase
        .from('guests')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventIdFromUrl)
        .eq('checked_in', true)

      setStats({ total: total || 0, checkedIn: checkedIn || 0 })
    }
  }, [eventIdFromUrl])

  useEffect(() => {
    loadEvent()

    // Handle QR code from URL
    if (codeFromUrl) {
      processQRCode(codeFromUrl)
    }
  }, [codeFromUrl, loadEvent])

  // Set up real-time stats updates
  useEffect(() => {
    if (!eventIdFromUrl) return

    const channel = supabase
      .channel('checkin-stats')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'guests', filter: `event_id=eq.${eventIdFromUrl}` },
        () => loadEvent()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventIdFromUrl, loadEvent])

  async function processQRCode(code: string) {
    setLoading(true)
    setScanResult({ status: null })

    try {
      // Find guest by QR code
      const { data: guest, error: guestError } = await supabase
        .from('guests')
        .select('*')
        .eq('qr_code', code)
        .single()

      if (guestError || !guest) {
        setScanResult({
          status: 'invalid',
          message: 'This QR code is not recognized. Please check and try again.'
        })
        
        // Log failed attempt
        if (eventIdFromUrl) {
          await supabase.from('checkin_logs').insert({
            guest_id: '00000000-0000-0000-0000-000000000000', // Placeholder for invalid
            event_id: eventIdFromUrl,
            scanned_qr: code,
            success: false,
            failure_reason: 'Invalid QR code',
            device_info: navigator.userAgent
          })
        }
        return
      }

      // Load event info
      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('id', guest.event_id)
        .single()

      // Check if already checked in
      if (guest.checked_in) {
        setScanResult({
          status: 'already_checked',
          guest,
          event: eventData || undefined,
          message: `${guest.name} has already checked in at ${formatTime(guest.checked_in_at!)}`
        })

        // Log duplicate scan
        await supabase.from('checkin_logs').insert({
          guest_id: guest.id,
          event_id: guest.event_id,
          scanned_qr: code,
          success: false,
          failure_reason: 'Already checked in',
          device_info: navigator.userAgent
        })
        return
      }

      // Check in the guest
      const { error: updateError } = await supabase
        .from('guests')
        .update({
          checked_in: true,
          checked_in_at: new Date().toISOString()
        })
        .eq('id', guest.id)

      if (updateError) throw updateError

      // Log successful check-in
      await supabase.from('checkin_logs').insert({
        guest_id: guest.id,
        event_id: guest.event_id,
        scanned_qr: code,
        success: true,
        device_info: navigator.userAgent
      })

      setScanResult({
        status: 'success',
        guest: { ...guest, checked_in: true, checked_in_at: new Date().toISOString() },
        event: eventData || undefined,
        message: `Welcome, ${guest.name}!`
      })

      // Refresh stats
      loadEvent()
    } catch (error) {
      console.error('Error processing QR:', error)
      setScanResult({
        status: 'invalid',
        message: 'An error occurred. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (manualCode.trim()) {
      processQRCode(manualCode.trim())
    }
  }

  async function startCamera() {
    setScanning(true)
    setScanResult({ status: null })

    try {
      const { Html5QrcodeScanner } = await import('html5-qrcode')
      
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        false
      )

      scanner.render(
        async (decodedText) => {
          scanner.clear()
          setScanning(false)
          
          // Extract code from URL if it's a full URL
          let code = decodedText
          if (decodedText.includes('code=')) {
            const url = new URL(decodedText)
            code = url.searchParams.get('code') || decodedText
          }
          
          await processQRCode(code)
        },
        (errorMessage) => {
          // Ignore scan errors, they happen frequently
        }
      )
    } catch (error) {
      console.error('Error starting camera:', error)
      setScanning(false)
    }
  }

  function resetScanner() {
    setScanResult({ status: null })
    setManualCode('')
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 md:p-6 border-b border-white/5 sticky top-0 bg-midnight-950/80 backdrop-blur-lg z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href={event ? `/admin/events/${event.id}` : '/admin'}>
            <Button variant="ghost" size="sm" className="text-sm">
              <ArrowLeft className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Back to Admin</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
          {event && (
            <div className="text-right">
              <p className="text-white font-medium text-sm md:text-base truncate max-w-[150px] md:max-w-none">{event.name}</p>
              <p className="text-xs md:text-sm text-gray-400">
                {stats.checkedIn} / {stats.total} checked in
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {scanResult.status === null ? (
              <motion.div
                key="scanner"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="text-center">
                  <div className="p-6 md:p-8 space-y-4 md:space-y-6">
                    <div className="w-16 h-16 md:w-20 md:h-20 mx-auto bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl md:rounded-2xl flex items-center justify-center">
                      <QrCode className="w-8 h-8 md:w-10 md:h-10 text-midnight-950" />
                    </div>
                    
                    <div>
                      <h1 className="text-xl md:text-2xl font-display font-bold text-white mb-1 md:mb-2">
                        Guest Check-In
                      </h1>
                      <p className="text-gray-400 text-sm md:text-base">
                        Scan a QR code or enter the code manually
                      </p>
                    </div>

                    {scanning ? (
                      <div className="space-y-4">
                        <div id="qr-reader" className="rounded-xl overflow-hidden" />
                        <Button variant="secondary" onClick={() => setScanning(false)} className="w-full">
                          Cancel Scanning
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Button onClick={startCamera} className="w-full" size="lg">
                          <Camera className="w-5 h-5" />
                          Scan QR Code
                        </Button>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10" />
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-[#0a1628] text-gray-500">or</span>
                          </div>
                        </div>

                        <form onSubmit={handleManualSubmit} className="space-y-3">
                          <input
                            type="text"
                            placeholder="Enter code manually..."
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-gold-500/50 focus:outline-none text-center font-mono text-sm md:text-base"
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                          />
                          <Button type="submit" variant="secondary" className="w-full" loading={loading}>
                            Check In
                          </Button>
                        </form>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card className={`text-center ${
                  scanResult.status === 'success' ? 'border-green-500/30' :
                  scanResult.status === 'already_checked' ? 'border-yellow-500/30' :
                  'border-red-500/30'
                }`}>
                  <div className="p-6 md:p-8 space-y-4 md:space-y-6">
                    {/* Status Icon */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                      className={`w-20 h-20 md:w-24 md:h-24 mx-auto rounded-full flex items-center justify-center ${
                        scanResult.status === 'success' ? 'bg-green-500/20 success-pulse' :
                        scanResult.status === 'already_checked' ? 'bg-yellow-500/20' :
                        'bg-red-500/20'
                      }`}
                    >
                      {scanResult.status === 'success' ? (
                        <CheckCircle2 className="w-10 h-10 md:w-12 md:h-12 text-green-400" />
                      ) : scanResult.status === 'already_checked' ? (
                        <RefreshCw className="w-10 h-10 md:w-12 md:h-12 text-yellow-400" />
                      ) : (
                        <XCircle className="w-10 h-10 md:w-12 md:h-12 text-red-400" />
                      )}
                    </motion.div>

                    {/* Status Message */}
                    <div>
                      <h2 className={`text-xl md:text-2xl font-display font-bold mb-1 md:mb-2 ${
                        scanResult.status === 'success' ? 'text-green-400' :
                        scanResult.status === 'already_checked' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {scanResult.status === 'success' ? 'Check-In Successful!' :
                         scanResult.status === 'already_checked' ? 'Already Checked In' :
                         'Invalid QR Code'}
                      </h2>
                      <p className="text-gray-400 text-sm md:text-base">{scanResult.message}</p>
                    </div>

                    {/* Guest Info */}
                    {scanResult.guest && (
                      <div className="bg-white/5 rounded-xl p-3 md:p-4 space-y-2 md:space-y-3 text-left">
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 md:w-5 md:h-5 text-gold-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs md:text-sm text-gray-400">Guest</p>
                            <p className="text-white font-medium text-sm md:text-base truncate">{scanResult.guest.name}</p>
                          </div>
                        </div>
                        {scanResult.event && (
                          <>
                            <div className="flex items-center gap-3">
                              <Calendar className="w-4 h-4 md:w-5 md:h-5 text-gold-400 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs md:text-sm text-gray-400">Event</p>
                                <p className="text-white font-medium text-sm md:text-base truncate">{scanResult.event.name}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <MapPin className="w-4 h-4 md:w-5 md:h-5 text-gold-400 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs md:text-sm text-gray-400">Venue</p>
                                <p className="text-white font-medium text-sm md:text-base truncate">{scanResult.event.venue}</p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <Button onClick={resetScanner} className="w-full" size="lg">
                      <QrCode className="w-5 h-5" />
                      Scan Another
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Live Stats */}
          {event && scanResult.status === null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 md:mt-6"
            >
              <Card>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-gray-400">Live Attendance</p>
                    <p className="text-xl md:text-2xl font-bold text-white">
                      {stats.checkedIn} <span className="text-gray-500">/ {stats.total}</span>
                    </p>
                  </div>
                  <div className="w-16 h-16 md:w-20 md:h-20 relative">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="50%"
                        cy="50%"
                        r="45%"
                        className="fill-none stroke-white/10 stroke-[6]"
                      />
                      <circle
                        cx="50%"
                        cy="50%"
                        r="45%"
                        className="fill-none stroke-gold-500 stroke-[6]"
                        strokeDasharray={`${(stats.checkedIn / Math.max(stats.total, 1)) * 283} 283`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-bold text-xs md:text-sm">
                        {stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}

export default function CheckinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500" />
      </div>
    }>
      <CheckinPageContent />
    </Suspense>
  )
}
