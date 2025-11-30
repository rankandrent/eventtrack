import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Event QR Invitation System',
  description: 'Send personalized WhatsApp invitations with unique QR codes for event check-in',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-pattern min-h-screen">
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(13, 31, 56, 0.95)',
              border: '1px solid rgba(245, 226, 154, 0.2)',
              color: 'white',
            },
          }}
        />
        {children}
      </body>
    </html>
  )
}
