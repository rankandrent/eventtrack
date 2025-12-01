import { NextResponse } from 'next/server'

// Mark as server-only and dynamic
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  // Dynamic imports to avoid build-time issues
  const { whatsappService } = await import('@/lib/whatsapp-web')
  const QRCode = (await import('qrcode')).default
  
  try {
    // Initialize WhatsApp service
    // Note: In serverless (Netlify), sessions use /tmp which is ephemeral
    await whatsappService.initialize()

    // Wait for QR code (with timeout)
    const qr = await Promise.race([
      new Promise<string>((resolve) => {
        whatsappService.once('qr', resolve)
      }),
      new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout waiting for QR code')), 30000)
      })
    ])

    // Generate QR code image
    const qrImage = await QRCode.toDataURL(qr)

    return NextResponse.json({ qr: qrImage })
  } catch (error: any) {
    console.error('WhatsApp connect error:', error)
    
    let errorMessage = error.message || 'Failed to generate QR code'
    
    if (error.message?.includes('ENOENT') || error.message?.includes('mkdir')) {
      errorMessage = 'Session storage error. Please try again or contact support.'
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NETLIFY ? 'Running on Netlify - sessions may not persist' : error.message
      },
      { status: 500 }
    )
  }
}
