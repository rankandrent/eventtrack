import { NextResponse } from 'next/server'

// Mark as server-only and dynamic
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  // Dynamic imports to avoid build-time issues
  const { whatsappService } = await import('@/lib/whatsapp-web')
  const QRCode = (await import('qrcode')).default
  try {
    // Initialize if not already
    await whatsappService.initialize()

    // Wait for QR code (with timeout)
    const qr = await Promise.race([
      new Promise<string>((resolve) => {
        whatsappService.once('qr', resolve)
      }),
      new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 30000)
      })
    ])

    // Generate QR code image
    const qrImage = await QRCode.toDataURL(qr)

    return NextResponse.json({ qr: qrImage })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to generate QR code' },
      { status: 500 }
    )
  }
}

