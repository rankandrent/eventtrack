import { NextResponse } from 'next/server'
import { whatsappService } from '@/lib/whatsapp-web'

export async function GET() {
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

