'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { QrCode, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    handleCallback()
  }, [])

  async function handleCallback() {
    try {
      // Get the session from the URL hash
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        setStatus('error')
        setMessage(error.message)
        return
      }

      if (session) {
        setStatus('success')
        setMessage('Email verified successfully!')
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/admin')
        }, 2000)
      } else {
        // Try to exchange the code for a session
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        
        if (accessToken) {
          setStatus('success')
          setMessage('Email verified successfully!')
          setTimeout(() => {
            router.push('/admin')
          }, 2000)
        } else {
          setStatus('error')
          setMessage('Verification link expired or invalid')
        }
      }
    } catch (error) {
      setStatus('error')
      setMessage('Something went wrong')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl flex items-center justify-center">
            <QrCode className="w-7 h-7 text-midnight-950" />
          </div>
          <span className="text-2xl font-display font-semibold gold-text">InviteQR</span>
        </Link>

        {status === 'loading' && (
          <div className="space-y-4">
            <Loader2 className="w-16 h-16 text-gold-400 mx-auto animate-spin" />
            <p className="text-white text-lg">Verifying your email...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Email Verified!</h1>
            <p className="text-gray-400">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="w-20 h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Verification Failed</h1>
            <p className="text-gray-400">{message}</p>
            <div className="pt-4 space-y-2">
              <Link href="/auth/login">
                <Button className="w-full">Go to Login</Button>
              </Link>
              <Link href="/auth/signup">
                <Button variant="secondary" className="w-full">Try Again</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

