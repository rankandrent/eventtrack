import { NextRequest, NextResponse } from 'next/server'
import { whatsappService } from '@/lib/whatsapp-web'
import { supabase } from '@/lib/supabase'
import { getAppUrl } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    // Check if WhatsApp is ready
    const status = whatsappService.getStatus()
    if (!status.isReady) {
      return NextResponse.json(
        { error: 'WhatsApp not connected. Please connect first.' },
        { status: 400 }
      )
    }

    const { eventId, guestIds } = await request.json()

    if (!eventId || !guestIds || !Array.isArray(guestIds)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    // Get guests
    const { data: guests, error: guestsError } = await supabase
      .from('guests')
      .select('*')
      .in('id', guestIds)

    if (guestsError || !guests || guests.length === 0) {
      return NextResponse.json(
        { error: 'Guests not found' },
        { status: 404 }
      )
    }

    // Get event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    const appUrl = getAppUrl()

    // Create message template
    const messageTemplate = `🎉 *${event.name}*

Dear {name}, you're invited!

📥 *View & Download Your Invitation:*
${appUrl}/invitation/{qr_code}

Click the link above to see event details and download your QR code.`

    // Send bulk messages
    const results = await whatsappService.sendBulk(
      guests.map(g => ({
        phone: g.phone,
        name: g.name,
        qr_code: g.qr_code
      })),
      messageTemplate
    )

    // Update sent status for successful sends
    const successfulIds = results
      .filter(r => r.success)
      .map(r => r.guest.id)

    if (successfulIds.length > 0) {
      await supabase
        .from('guests')
        .update({
          invitation_sent: true,
          invitation_sent_at: new Date().toISOString()
        })
        .in('id', successfulIds)

      // Log successful sends
      for (const result of results.filter(r => r.success)) {
        await supabase.from('whatsapp_logs').insert({
          guest_id: result.guest.id,
          event_id: eventId,
          message_type: 'invitation',
          status: 'sent',
          sent_at: new Date().toISOString()
        })
      }
    }

    // Log failures
    for (const result of results.filter(r => !r.success)) {
      await supabase.from('whatsapp_logs').insert({
        guest_id: result.guest.id,
        event_id: eventId,
        message_type: 'invitation',
        status: 'failed',
        error_message: result.error || 'Unknown error',
        sent_at: new Date().toISOString()
      })
    }

    return NextResponse.json({
      success: true,
      sent: successfulIds.length,
      failed: results.filter(r => !r.success).length,
      total: results.length,
      results: results.map(r => ({
        guest: r.guest.name,
        phone: r.guest.phone,
        success: r.success,
        error: r.error || null
      }))
    })
  } catch (error: any) {
    console.error('Bulk send error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send messages' },
      { status: 500 }
    )
  }
}

