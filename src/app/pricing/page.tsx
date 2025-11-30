'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  QrCode, Check, Crown, Sparkles, Users, Calendar,
  MessageSquare, BarChart3, Shield, Zap, ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'

const plans = [
  {
    name: 'Basic',
    price: 29,
    period: 'month',
    description: 'Perfect for small events',
    features: [
      'Up to 3 events/month',
      'Up to 100 guests/event',
      'WhatsApp invitations',
      'QR code check-in',
      'Basic analytics',
      'Email support',
    ],
    popular: false,
  },
  {
    name: 'Pro',
    price: 79,
    period: 'month',
    description: 'For event professionals',
    features: [
      'Unlimited events',
      'Up to 500 guests/event',
      'WhatsApp invitations',
      'QR code check-in',
      'Advanced analytics',
      'Priority support',
      'Custom branding',
      'Excel import/export',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 199,
    period: 'month',
    description: 'For large organizations',
    features: [
      'Unlimited events',
      'Unlimited guests',
      'WhatsApp invitations',
      'QR code check-in',
      'Advanced analytics',
      '24/7 support',
      'Custom branding',
      'API access',
      'Dedicated account manager',
      'White-label option',
    ],
    popular: false,
  },
]

export default function PricingPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      setUser(session.user)
      
      // Get subscription
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .single()
      
      setSubscription(sub)
    }
    
    setLoading(false)
  }

  async function handleSubscribe(planName: string) {
    if (!user) {
      router.push('/auth/signup')
      return
    }

    setSelectedPlan(planName)
    
    // For now, show contact message
    // In production, integrate with Stripe or your payment provider
    toast.success(`Contact us to subscribe to ${planName} plan!`, {
      description: 'WhatsApp: +92 300 1234567',
      duration: 10000,
    })

    // Update subscription plan (for demo - in production this would happen after payment)
    // await supabase
    //   .from('subscriptions')
    //   .update({ 
    //     plan: planName.toLowerCase(),
    //     status: 'active',
    //     paid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    //   })
    //   .eq('user_id', user.id)
  }

  function getTrialDaysLeft() {
    if (!subscription?.trial_end) return 0
    const end = new Date(subscription.trial_end)
    const now = new Date()
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500" />
      </div>
    )
  }

  const trialDaysLeft = getTrialDaysLeft()
  const isTrialExpired = subscription?.plan === 'trial' && trialDaysLeft <= 0

  return (
    <div className="min-h-screen py-8 md:py-12 px-4">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-12">
        <nav className="flex items-center justify-between mb-12">
          <Link href="/" className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg md:rounded-xl flex items-center justify-center">
              <QrCode className="w-4 h-4 md:w-6 md:h-6 text-midnight-950" />
            </div>
            <span className="text-lg md:text-xl font-display font-semibold gold-text">InviteQR</span>
          </Link>
          
          {user ? (
            <Link href="/admin">
              <Button variant="secondary">Dashboard</Button>
            </Link>
          ) : (
            <Link href="/auth/login">
              <Button variant="secondary">Login</Button>
            </Link>
          )}
        </nav>

        {/* Trial Banner */}
        {user && subscription?.plan === 'trial' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl p-4 mb-8 ${
              isTrialExpired 
                ? 'bg-red-500/20 border border-red-500/30' 
                : 'bg-gold-500/20 border border-gold-500/30'
            }`}
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Sparkles className={`w-5 h-5 ${isTrialExpired ? 'text-red-400' : 'text-gold-400'}`} />
                <div>
                  <p className={`font-medium ${isTrialExpired ? 'text-red-300' : 'text-gold-300'}`}>
                    {isTrialExpired 
                      ? 'Your free trial has expired!' 
                      : `Free Trial: ${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} left`
                    }
                  </p>
                  <p className="text-sm text-gray-400">
                    {isTrialExpired 
                      ? 'Subscribe to continue using InviteQR' 
                      : 'Choose a plan to continue after trial ends'
                    }
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-500/10 border border-gold-500/20 mb-6">
              <Crown className="w-4 h-4 text-gold-400" />
              <span className="text-gold-300 text-sm font-medium">Simple Pricing</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-display font-bold text-white mb-4"
          >
            Choose Your Plan
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg max-w-2xl mx-auto"
          >
            Start with a 3-day free trial. No credit card required.
          </motion.p>
        </div>
      </header>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className={`relative h-full ${plan.popular ? 'border-gold-500/50' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-gradient-to-r from-gold-500 to-gold-600 text-midnight-950 text-xs font-bold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="p-6 md:p-8">
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-4xl md:text-5xl font-display font-bold gold-text">
                      ${plan.price}
                    </span>
                    <span className="text-gray-400">/{plan.period}</span>
                  </div>

                  <Button 
                    onClick={() => handleSubscribe(plan.name)}
                    className="w-full mb-6"
                    variant={plan.popular ? 'default' : 'secondary'}
                    loading={selectedPlan === plan.name}
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </Button>

                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto mt-20">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-center gold-text mb-12">
          All Plans Include
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: MessageSquare, label: 'WhatsApp Integration' },
            { icon: QrCode, label: 'Unique QR Codes' },
            { icon: Shield, label: 'One-Time Scan' },
            { icon: Users, label: 'Guest Management' },
            { icon: Calendar, label: 'Event Dashboard' },
            { icon: BarChart3, label: 'Analytics' },
            { icon: Zap, label: 'Real-Time Updates' },
            { icon: Crown, label: 'Premium Support' },
          ].map((item) => (
            <div key={item.label} className="text-center p-4">
              <item.icon className="w-8 h-8 text-gold-400 mx-auto mb-3" />
              <p className="text-gray-300 text-sm">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="max-w-2xl mx-auto mt-20 text-center">
        <Card className="p-8">
          <h3 className="text-xl font-bold text-white mb-3">Need a Custom Plan?</h3>
          <p className="text-gray-400 mb-6">
            Contact us for custom pricing and enterprise solutions
          </p>
          <a 
            href="https://wa.me/923001234567"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-500 text-white font-medium hover:bg-green-600 transition-all"
          >
            <MessageSquare className="w-5 h-5" />
            Contact on WhatsApp
          </a>
        </Card>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5">
        <div className="flex items-center justify-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center">
            <QrCode className="w-3 h-3 text-midnight-950" />
          </div>
          <span className="font-display font-medium gold-text text-sm">InviteQR</span>
        </div>
        <p className="text-center text-gray-500 text-xs mt-4">
          © {new Date().getFullYear()} Event QR Invitation System
        </p>
      </footer>
    </div>
  )
}

