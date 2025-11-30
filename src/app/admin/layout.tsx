'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { QrCode, Calendar, Users, BarChart3, Home, Menu, X, LogOut, Crown, Sparkles, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Events', href: '/admin/events', icon: Calendar },
  { name: 'Guests', href: '/admin/guests', icon: Users },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      router.push('/auth/login')
      return
    }
    
    setUser(session.user)

    // Get or create subscription
    let { data: sub, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .single()
    
    // If no subscription exists, create one
    if (error || !sub) {
      const { data: newSub } = await supabase
        .from('subscriptions')
        .insert({
          user_id: session.user.id,
          plan: 'trial',
          status: 'active',
          trial_start: new Date().toISOString(),
          trial_end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single()
      
      sub = newSub
    }

    setSubscription(sub)
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Logged out successfully')
    router.push('/auth/login')
  }

  function getTrialDaysLeft() {
    if (!subscription?.trial_end) return 0
    const end = new Date(subscription.trial_end)
    const now = new Date()
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  }

  function isSubscriptionActive() {
    if (!subscription) return false
    
    // Check if paid subscription is active
    if (subscription.plan !== 'trial' && subscription.paid_until) {
      return new Date(subscription.paid_until) > new Date()
    }
    
    // Check if trial is still active
    if (subscription.plan === 'trial') {
      return new Date(subscription.trial_end) > new Date()
    }
    
    return false
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500" />
      </div>
    )
  }

  const trialDaysLeft = getTrialDaysLeft()
  const isActive = isSubscriptionActive()
  const isTrialExpired = subscription?.plan === 'trial' && trialDaysLeft <= 0

  // Show subscription required screen if trial expired
  if (isTrialExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white mb-3">
            Free Trial Expired
          </h1>
          <p className="text-gray-400 mb-8">
            Your 3-day free trial has ended. Subscribe to a plan to continue using InviteQR.
          </p>
          <div className="space-y-3">
            <Link href="/pricing">
              <Button className="w-full" size="lg">
                <Crown className="w-5 h-5" />
                View Pricing Plans
              </Button>
            </Link>
            <Button variant="ghost" onClick={handleLogout} className="w-full">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Trial Banner - Mobile */}
      {subscription?.plan === 'trial' && trialDaysLeft <= 3 && (
        <div className="md:hidden bg-gold-500/20 border-b border-gold-500/30 px-4 py-2">
          <Link href="/pricing" className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold-400" />
              <span className="text-gold-300 text-sm font-medium">
                {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left in trial
              </span>
            </div>
            <span className="text-gold-400 text-xs font-medium">Upgrade →</span>
          </Link>
        </div>
      )}

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-midnight-950/80 backdrop-blur-lg sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center">
            <QrCode className="w-4 h-4 text-midnight-950" />
          </div>
          <span className="text-lg font-display font-semibold gold-text">InviteQR</span>
        </Link>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-white hover:bg-white/5 rounded-lg"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:static inset-y-0 left-0 z-50 w-64 bg-midnight-950/95 md:bg-midnight-950/50 border-r border-white/5 p-4 md:p-6 flex flex-col transform transition-transform duration-300 ease-in-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Desktop Logo */}
        <Link href="/" className="hidden md:flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl flex items-center justify-center">
            <QrCode className="w-6 h-6 text-midnight-950" />
          </div>
          <span className="text-xl font-display font-semibold gold-text">InviteQR</span>
        </Link>

        {/* Trial Banner - Desktop */}
        {subscription?.plan === 'trial' && (
          <Link 
            href="/pricing" 
            className="hidden md:block mb-6 p-3 rounded-xl bg-gold-500/10 border border-gold-500/20 hover:bg-gold-500/20 transition-all"
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-gold-400" />
              <span className="text-gold-300 text-sm font-medium">Free Trial</span>
            </div>
            <p className="text-xs text-gray-400">
              {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} remaining
            </p>
            <p className="text-xs text-gold-400 mt-1 font-medium">Upgrade Now →</p>
          </Link>
        )}

        {/* Mobile Close Button */}
        <div className="md:hidden flex items-center justify-between mb-6 pt-2">
          <span className="text-lg font-display font-semibold gold-text">Menu</span>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-2 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="space-y-1 md:space-y-2 flex-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/admin' && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                  isActive 
                    ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="pt-4 md:pt-6 border-t border-white/5 space-y-2">
          <Link
            href="/pricing"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gold-400 hover:bg-gold-500/10 transition-all"
          >
            <Crown className="w-5 h-5" />
            Upgrade Plan
          </Link>
          
          {user && (
            <div className="px-4 py-2 text-xs text-gray-500 truncate">
              {user.email}
            </div>
          )}
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
