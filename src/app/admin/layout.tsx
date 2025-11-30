'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { QrCode, Calendar, Users, BarChart3, Settings, Home } from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Events', href: '/admin/events', icon: Calendar },
  { name: 'Guests', href: '/admin/guests', icon: Users },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-midnight-950/50 border-r border-white/5 p-6 flex flex-col">
        <Link href="/" className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl flex items-center justify-center">
            <QrCode className="w-6 h-6 text-midnight-950" />
          </div>
          <span className="text-xl font-display font-semibold gold-text">InviteQR</span>
        </Link>

        <nav className="space-y-2 flex-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/admin' && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.name}
                href={item.href}
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

        <div className="pt-6 border-t border-white/5">
          <Link
            href="/checkin"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <QrCode className="w-5 h-5" />
            Scanner Mode
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}

