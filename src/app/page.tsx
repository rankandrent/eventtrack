'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { QrCode, Send, Users, CheckCircle2, Sparkles, Calendar, Shield, Zap, Menu, X, LogIn, UserPlus } from 'lucide-react'
import { useState } from 'react'

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-48 md:w-72 h-48 md:h-72 bg-gold-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-64 md:w-96 h-64 md:h-96 bg-midnight-500/30 rounded-full blur-3xl" />
        </div>
        
        <nav className="relative z-10 flex items-center justify-between px-4 md:px-8 py-4 md:py-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg md:rounded-xl flex items-center justify-center">
              <QrCode className="w-4 h-4 md:w-6 md:h-6 text-midnight-950" />
            </div>
            <span className="text-lg md:text-xl font-display font-semibold gold-text">InviteQR</span>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-3">
            <Link 
              href="/auth/login" 
              className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Login
            </Link>
            <Link 
              href="/auth/signup" 
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-gold-500 to-gold-600 text-midnight-950 font-medium hover:from-gold-400 hover:to-gold-500 transition-all shadow-lg shadow-gold-500/25 flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Sign Up Free
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden absolute top-16 left-0 right-0 z-50 bg-midnight-950/95 backdrop-blur-lg border-b border-white/10 p-4"
          >
            <div className="flex flex-col gap-3">
              <Link 
                href="/auth/login" 
                className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium text-center flex items-center justify-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LogIn className="w-4 h-4" />
                Login
              </Link>
              <Link 
                href="/auth/signup" 
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-midnight-950 font-medium text-center flex items-center justify-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <UserPlus className="w-4 h-4" />
                Sign Up Free
              </Link>
            </div>
          </motion.div>
        )}

        <div className="relative z-10 px-4 md:px-8 py-12 md:py-20 max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-gold-500/10 border border-gold-500/20 mb-6 md:mb-8">
              <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-gold-400" />
              <span className="text-gold-300 text-xs md:text-sm font-medium">Elegant Event Management</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-display font-bold mb-4 md:mb-6 leading-tight"
          >
            <span className="gold-text">Personalized</span>
            <br />
            <span className="text-white">Event Invitations</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base md:text-xl text-gray-400 max-w-2xl mx-auto mb-8 md:mb-10 px-4"
          >
            Send beautiful WhatsApp invitations with unique QR codes. 
            Track attendance in real-time with one-scan check-in validation.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 px-4"
          >
            <Link 
              href="/auth/signup"
              className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 rounded-full bg-gradient-to-r from-gold-500 to-gold-600 text-midnight-950 font-semibold text-base md:text-lg hover:from-gold-400 hover:to-gold-500 transition-all shadow-xl shadow-gold-500/30 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4 md:w-5 md:h-5" />
              Get Started Free
            </Link>
            <Link 
              href="/auth/login"
              className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 rounded-full bg-white/5 border border-white/10 text-white font-semibold text-base md:text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4 md:w-5 md:h-5" />
              Login to Dashboard
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Features Section */}
      <section className="px-4 md:px-8 py-16 md:py-24 max-w-7xl mx-auto">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold gold-text mb-3 md:mb-4">
            Everything You Need
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto text-sm md:text-base px-4">
            A complete solution for managing your event invitations and tracking attendance
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[
            {
              icon: Send,
              title: 'WhatsApp Invites',
              description: 'Send personalized invitations with QR code directly via WhatsApp',
              delay: 0,
            },
            {
              icon: QrCode,
              title: 'Unique QR Codes',
              description: 'Each guest receives a unique QR code for secure check-in',
              delay: 0.1,
            },
            {
              icon: Shield,
              title: 'One-Time Scan',
              description: 'QR codes can only be scanned once to prevent duplicate entries',
              delay: 0.2,
            },
            {
              icon: Zap,
              title: 'Real-Time Tracking',
              description: 'Monitor attendance as guests check in with live updates',
              delay: 0.3,
            },
          ].map((feature) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: feature.delay }}
              viewport={{ once: true }}
              className="glass-card rounded-xl md:rounded-2xl p-4 md:p-6 hover:border-gold-500/30 transition-all group"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-gold-400/20 to-gold-600/20 rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-4 group-hover:from-gold-400/30 group-hover:to-gold-600/30 transition-all">
                <feature.icon className="w-5 h-5 md:w-6 md:h-6 text-gold-400" />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-white mb-1 md:mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-xs md:text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 md:px-8 py-16 md:py-24 max-w-7xl mx-auto">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold gold-text mb-3 md:mb-4">
            How It Works
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto text-sm md:text-base px-4">
            Get started in 3 simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {[
            { step: '1', title: 'Create Event', description: 'Sign up and create your event with all the details' },
            { step: '2', title: 'Add Guests', description: 'Add guests manually or import from Excel. Each gets a unique QR code' },
            { step: '3', title: 'Send & Scan', description: 'Send invitations via WhatsApp and scan QR codes at the venue' },
          ].map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gold-500 to-gold-600 rounded-2xl flex items-center justify-center text-2xl font-bold text-midnight-950">
                {item.step}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 md:px-8 py-12 md:py-16 max-w-7xl mx-auto">
        <div className="glass-card rounded-2xl md:rounded-3xl p-6 md:p-12 text-center">
          <div className="grid grid-cols-3 gap-4 md:gap-8">
            {[
              { icon: Calendar, label: 'Events Created', value: '∞' },
              { icon: Users, label: 'Guests Managed', value: '∞' },
              { icon: CheckCircle2, label: 'Check-ins', value: '100%' },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <stat.icon className="w-6 h-6 md:w-8 md:h-8 text-gold-400 mx-auto mb-2 md:mb-3" />
                <div className="text-xl md:text-4xl font-display font-bold gold-text mb-1 md:mb-2">{stat.value}</div>
                <div className="text-gray-400 text-xs md:text-base">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 md:px-8 py-16 md:py-24 max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-4xl font-display font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-gray-400 mb-8">
            Create your first event and start sending beautiful invitations today
          </p>
          <Link 
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-gold-500 to-gold-600 text-midnight-950 font-semibold text-lg hover:from-gold-400 hover:to-gold-500 transition-all shadow-xl shadow-gold-500/30"
          >
            <UserPlus className="w-5 h-5" />
            Sign Up Free
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="px-4 md:px-8 py-6 md:py-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center">
              <QrCode className="w-3 h-3 md:w-4 md:h-4 text-midnight-950" />
            </div>
            <span className="font-display font-medium gold-text text-sm md:text-base">InviteQR</span>
          </div>
          <p className="text-gray-500 text-xs md:text-sm text-center">
            © {new Date().getFullYear()} Event QR Invitation System
          </p>
        </div>
      </footer>
    </div>
  )
}
