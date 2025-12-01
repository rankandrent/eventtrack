import { NextResponse } from 'next/server'

// Mark as server-only and dynamic
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  // Dynamic imports to avoid build-time issues
  const { whatsappService } = await import('@/lib/whatsapp-web')
  const QRCode = (await import('qrcode')).default
  try {
    // Check if we're in a serverless environment
    const isServerless = process.env.NETLIFY || process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
    
    if (isServerless) {
      return NextResponse.json(
        { 
          error: 'WhatsApp connection requires a persistent server environment. ' +
                 'Serverless functions have limitations. Please use a dedicated server.',
          serverless: true
        },
        { status: 503 }
      )
    }

    // Initialize if not already
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
      errorMessage = 'Cannot create session directory. This feature requires a dedicated server, not serverless functions.'
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message
      },
      { status: 500 }
    )
  }
}

