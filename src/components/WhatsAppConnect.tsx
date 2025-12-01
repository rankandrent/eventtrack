'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  MessageSquare, CheckCircle2, XCircle, RefreshCw, 
  QrCode, AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

export function WhatsAppConnect() {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    checkStatus()
    // Check status every 5 seconds
    const interval = setInterval(checkStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  async function checkStatus() {
    try {
      const res = await fetch('/api/whatsapp/status')
      const data = await res.json()
      setIsConnected(data.isReady || false)
      setChecking(false)
    } catch (error) {
      setChecking(false)
    }
  }

  async function connectWhatsApp() {
    setIsConnecting(true)
    setQrCode(null)

    try {
      const res = await fetch('/api/whatsapp/connect')
      const data = await res.json()

      if (data.error) {
        toast.error(data.error, {
          description: data.details || 'Please try again',
          duration: 8000
        })
        setIsConnecting(false)
        return
      }

      if (data.qr) {
        setQrCode(data.qr)
        toast.info('Scan QR code with your WhatsApp', { duration: 10000 })
      }

      // Poll for connection status
      const pollInterval = setInterval(async () => {
        const statusRes = await fetch('/api/whatsapp/status')
        const statusData = await statusRes.json()

        if (statusData.isReady) {
          setIsConnected(true)
          setQrCode(null)
          setIsConnecting(false)
          clearInterval(pollInterval)
          toast.success('WhatsApp connected successfully!')
        }
      }, 2000)

      // Timeout after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval)
        if (!isConnected) {
          setIsConnecting(false)
          setQrCode(null)
          toast.error('Connection timeout. Please try again.')
        }
      }, 120000)

    } catch (error) {
      console.error('Connection error:', error)
      toast.error('Failed to connect WhatsApp')
      setIsConnecting(false)
    }
  }

  if (checking) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
          <span className="text-gray-400">Checking connection...</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            isConnected ? 'bg-green-500/20' : 'bg-gray-500/20'
          }`}>
            {isConnected ? (
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            ) : (
              <MessageSquare className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white mb-1">WhatsApp Connection</h3>
            <p className="text-sm text-gray-400">
              {isConnected 
                ? 'Connected! You can now send bulk messages.' 
                : 'Connect your WhatsApp to send bulk invitations for free'}
            </p>
            {!isConnected && (
              <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-yellow-300">
                    You'll need to scan a QR code with your phone. Make sure WhatsApp is installed on your phone.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        {!isConnected && (
          <Button
            onClick={connectWhatsApp}
            disabled={isConnecting}
            size="sm"
            className="flex-shrink-0"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <QrCode className="w-4 h-4" />
                Connect
              </>
            )}
          </Button>
        )}
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {qrCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-6 p-6 rounded-xl bg-white/5 border border-white/10"
          >
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <QrCode className="w-5 h-5 text-gold-400" />
                <h4 className="font-semibold text-white">Scan QR Code</h4>
              </div>
              <p className="text-sm text-gray-400">
                Open WhatsApp on your phone → Settings → Linked Devices → Link a Device
              </p>
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-xl">
                  <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Scan this QR code with your phone to connect
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQrCode(null)
                  setIsConnecting(false)
                }}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

