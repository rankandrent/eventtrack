'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, Guest, Event } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  QrCode, CheckCircle2, XCircle, Camera, RefreshCw, 
  User, Users, Shield, Scan
} from 'lucide-react'
import { formatTime } from '@/lib/utils'

type ScanResult = {
  status: 'success' | 'already_checked' | 'invalid' | null
  guest?: Guest
  message?: string
}

export default function ScannerPage() {
  const params = useParams()
  const eventId = params.eventId as string

  const [event, setEvent] = useState<Event | null>(null)
  const [scanning, setScanning] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [scanResult, setScanResult] = useState<ScanResult>({ status: null })
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ total: 0, checkedIn: 0 })
  const [recentCheckins, setRecentCheckins] = useState<Guest[]>([])

  const loadData = useCallback(async () => {
    // Get current user first
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      window.location.href = '/auth/login'
      return
    }

    const userId = session.user.id

    // Load event - verify ownership
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('user_id', userId)  // CRITICAL: Only load if user owns this event
      .single()
    
    if (!eventData) {
      window.location.href = '/admin/events'
      return
    }
    
    setEvent(eventData)

    // Load stats
    const { count: total } = await supabase
      .from('guests')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)

    const { count: checkedIn } = await supabase
      .from('guests')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('checked_in', true)

    setStats({ total: total || 0, checkedIn: checkedIn || 0 })

    // Load recent check-ins
    const { data: recent } = await supabase
      .from('guests')
      .select('*')
      .eq('event_id', eventId)
      .eq('checked_in', true)
      .order('checked_in_at', { ascending: false })
      .limit(5)

    setRecentCheckins(recent || [])
  }, [eventId])

  useEffect(() => {
    loadData()

    // Real-time updates
    const channel = supabase
      .channel('scanner-updates')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'guests', filter: `event_id=eq.${eventId}` },
        () => loadData()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId, loadData])

  async function processQRCode(code: string) {
    setLoading(true)
    setScanResult({ status: null })

    try {
      // Extract code if it's a URL
      let qrCode = code
      if (code.includes('code=')) {
        try {
          const url = new URL(code)
          qrCode = url.searchParams.get('code') || code
        } catch {
          // Not a URL, use as-is
        }
      }

      // Find guest by QR code
      const { data: guest, error: guestError } = await supabase
        .from('guests')
        .select('*')
        .eq('qr_code', qrCode)
        .eq('event_id', eventId)
        .single()

      if (guestError || !guest) {
        setScanResult({
          status: 'invalid',
          message: 'Invalid QR code for this event'
        })
        
        await supabase.from('checkin_logs').insert({
          guest_id: '00000000-0000-0000-0000-000000000000',
          event_id: eventId,
          scanned_qr: qrCode,
          success: false,
          failure_reason: 'Invalid QR code',
          device_info: navigator.userAgent
        })
        return
      }

      // Check if already checked in
      if (guest.checked_in) {
        setScanResult({
          status: 'already_checked',
          guest,
          message: `Already checked in at ${formatTime(guest.checked_in_at!)}`
        })

        await supabase.from('checkin_logs').insert({
          guest_id: guest.id,
          event_id: eventId,
          scanned_qr: qrCode,
          success: false,
          failure_reason: 'Already checked in',
          device_info: navigator.userAgent
        })
        return
      }

      // Check in the guest
      await supabase
        .from('guests')
        .update({
          checked_in: true,
          checked_in_at: new Date().toISOString()
        })
        .eq('id', guest.id)

      await supabase.from('checkin_logs').insert({
        guest_id: guest.id,
        event_id: eventId,
        scanned_qr: qrCode,
        success: true,
        device_info: navigator.userAgent
      })

      setScanResult({
        status: 'success',
        guest: { ...guest, checked_in: true },
        message: 'Welcome!'
      })

      loadData()
    } catch (error) {
      console.error('Error processing QR:', error)
      setScanResult({
        status: 'invalid',
        message: 'Error processing QR code'
      })
    } finally {
      setLoading(false)
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (manualCode.trim()) {
      processQRCode(manualCode.trim())
      setManualCode('')
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
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1,
        },
        false
      )

      scanner.render(
        async (decodedText) => {
          scanner.clear()
          setScanning(false)
          await processQRCode(decodedText)
        },
        () => {}
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

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-midnight-950/80 backdrop-blur-lg border-b border-white/5 p-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-midnight-950" />
              </div>
              <div>
                <h1 className="text-white font-semibold text-sm md:text-base truncate max-w-[180px] md:max-w-none">
                  {event.name}
                </h1>
                <p className="text-xs text-gray-400">Gate Scanner</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl md:text-2xl font-bold text-white">
                {stats.checkedIn}
                <span className="text-gray-500 text-sm md:text-base">/{stats.total}</span>
              </p>
              <p className="text-[10px] md:text-xs text-gray-400">Checked In</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4">
        <div className="max-w-lg mx-auto space-y-4">
          <AnimatePresence mode="wait">
            {scanResult.status === null ? (
              <motion.div
                key="scanner"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card>
                  <div className="p-6 space-y-4">
                    <div className="text-center">
                      <Scan className="w-12 h-12 text-gold-400 mx-auto mb-3" />
                      <h2 className="text-lg font-semibold text-white">Scan Guest QR Code</h2>
                      <p className="text-sm text-gray-400">Point camera at guest&apos;s QR code</p>
                    </div>

                    {scanning ? (
                      <div className="space-y-4">
                        <div id="qr-reader" className="rounded-xl overflow-hidden" />
                        <Button variant="secondary" onClick={() => setScanning(false)} className="w-full">
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Button onClick={startCamera} className="w-full" size="lg">
                          <Camera className="w-5 h-5" />
                          Start Scanning
                        </Button>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10" />
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-[#0a1628] text-gray-500">or enter code</span>
                          </div>
                        </div>

                        <form onSubmit={handleManualSubmit} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Enter code..."
                            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-gold-500/50 focus:outline-none font-mono text-sm"
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                          />
                          <Button type="submit" loading={loading}>
                            Check
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
                <Card className={`${
                  scanResult.status === 'success' ? 'border-green-500/50 bg-green-500/5' :
                  scanResult.status === 'already_checked' ? 'border-yellow-500/50 bg-yellow-500/5' :
                  'border-red-500/50 bg-red-500/5'
                }`}>
                  <div className="p-6 text-center space-y-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                      className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center ${
                        scanResult.status === 'success' ? 'bg-green-500/20' :
                        scanResult.status === 'already_checked' ? 'bg-yellow-500/20' :
                        'bg-red-500/20'
                      }`}
                    >
                      {scanResult.status === 'success' ? (
                        <CheckCircle2 className="w-14 h-14 text-green-400" />
                      ) : scanResult.status === 'already_checked' ? (
                        <RefreshCw className="w-14 h-14 text-yellow-400" />
                      ) : (
                        <XCircle className="w-14 h-14 text-red-400" />
                      )}
                    </motion.div>

                    <div>
                      <h2 className={`text-2xl font-bold mb-1 ${
                        scanResult.status === 'success' ? 'text-green-400' :
                        scanResult.status === 'already_checked' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {scanResult.status === 'success' ? '✓ VERIFIED' :
                         scanResult.status === 'already_checked' ? '⚠ DUPLICATE' :
                         '✗ INVALID'}
                      </h2>
                      
                      {scanResult.guest && (
                        <p className="text-2xl font-bold text-white mt-2">
                          {scanResult.guest.name}
                        </p>
                      )}
                      
                      <p className="text-gray-400 text-sm mt-1">{scanResult.message}</p>
                    </div>

                    <Button onClick={resetScanner} className="w-full" size="lg">
                      <Scan className="w-5 h-5" />
                      Scan Next Guest
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recent Check-ins */}
          {recentCheckins.length > 0 && scanResult.status === null && (
            <Card>
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Recent Check-ins
                </h3>
                <div className="space-y-2">
                  {recentCheckins.map((guest) => (
                    <div 
                      key={guest.id}
                      className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        </div>
                        <span className="text-white text-sm">{guest.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatTime(guest.checked_in_at!)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Stats Bar */}
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Attendance Progress</span>
              <span className="text-sm font-bold text-white">
                {stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0}%
              </span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.total > 0 ? (stats.checkedIn / stats.total) * 100 : 0}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-gold-500 to-gold-600 rounded-full"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

