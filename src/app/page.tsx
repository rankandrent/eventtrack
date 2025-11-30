'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { QrCode, Send, Users, CheckCircle2, Sparkles, Calendar, Shield, Zap } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gold-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-midnight-500/30 rounded-full blur-3xl" />
        </div>
        
        <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl flex items-center justify-center">
              <QrCode className="w-6 h-6 text-midnight-950" />
            </div>
            <span className="text-xl font-display font-semibold gold-text">InviteQR</span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/admin" 
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-gold-500 to-gold-600 text-midnight-950 font-medium hover:from-gold-400 hover:to-gold-500 transition-all shadow-lg shadow-gold-500/25"
            >
              Admin Dashboard
            </Link>
          </div>
        </nav>

        <div className="relative z-10 px-8 py-20 max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-500/10 border border-gold-500/20 mb-8">
              <Sparkles className="w-4 h-4 text-gold-400" />
              <span className="text-gold-300 text-sm font-medium">Elegant Event Management</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight"
          >
            <span className="gold-text">Personalized</span>
            <br />
            <span className="text-white">Event Invitations</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto mb-10"
          >
            Send beautiful WhatsApp invitations with unique QR codes. 
            Track attendance in real-time with one-scan check-in validation.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link 
              href="/admin/events/new"
              className="px-8 py-4 rounded-full bg-gradient-to-r from-gold-500 to-gold-600 text-midnight-950 font-semibold text-lg hover:from-gold-400 hover:to-gold-500 transition-all shadow-xl shadow-gold-500/30 flex items-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Create Event
            </Link>
            <Link 
              href="/checkin"
              className="px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white font-semibold text-lg hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <QrCode className="w-5 h-5" />
              Scan QR Code
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Features Section */}
      <section className="px-8 py-24 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold gold-text mb-4">
            Everything You Need
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            A complete solution for managing your event invitations and tracking attendance
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Send,
              title: 'WhatsApp Invites',
              description: 'Send personalized invitations directly to guests via WhatsApp',
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
              className="glass-card rounded-2xl p-6 hover:border-gold-500/30 transition-all group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-gold-400/20 to-gold-600/20 rounded-xl flex items-center justify-center mb-4 group-hover:from-gold-400/30 group-hover:to-gold-600/30 transition-all">
                <feature.icon className="w-6 h-6 text-gold-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-8 py-16 max-w-7xl mx-auto">
        <div className="glass-card rounded-3xl p-12 text-center">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Calendar, label: 'Events Created', value: '∞' },
              { icon: Users, label: 'Guests Managed', value: '∞' },
              { icon: CheckCircle2, label: 'Successful Check-ins', value: '100%' },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <stat.icon className="w-8 h-8 text-gold-400 mx-auto mb-3" />
                <div className="text-4xl font-display font-bold gold-text mb-2">{stat.value}</div>
                <div className="text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center">
              <QrCode className="w-4 h-4 text-midnight-950" />
            </div>
            <span className="font-display font-medium gold-text">InviteQR</span>
          </div>
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Event QR Invitation System
          </p>
        </div>
      </footer>
    </div>
  )
}

