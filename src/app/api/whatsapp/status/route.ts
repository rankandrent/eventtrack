import { NextResponse } from 'next/server'

// Mark as server-only and dynamic
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  // Dynamic import to avoid build-time issues
  const { whatsappService } = await import('@/lib/whatsapp-web')
  try {
    const status = whatsappService.getStatus()
    return NextResponse.json(status)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    )
  }
}

