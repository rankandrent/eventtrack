import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAppUrl } from '@/lib/utils'

// Mark as server-only and dynamic
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
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

    // Check if WhatsApp Business API credentials are available
    const whatsappApiUrl = process.env.WHATSAPP_API_URL
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

    // Use WhatsApp Business API if credentials are set
    if (whatsappApiUrl && phoneNumberId && accessToken && accessToken !== 'your_access_token') {
      return await sendViaBusinessAPI(guests, event, appUrl, whatsappApiUrl, phoneNumberId, accessToken, eventId)
    }

    // Fallback to whatsapp-web.js
    return await sendViaWhatsAppWeb(guests, event, appUrl, eventId)
  } catch (error: any) {
    console.error('Bulk send error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send messages' },
      { status: 500 }
    )
  }
}

// Send via WhatsApp Business API (automatic, no QR needed)
async function sendViaBusinessAPI(
  guests: any[],
  event: any,
  appUrl: string,
  whatsappApiUrl: string,
  phoneNumberId: string,
  accessToken: string,
  eventId: string
) {
  const results: Array<{ guest: any; success: boolean; error?: string }> = []

  // Send messages with delay to avoid rate limits
  for (const guest of guests) {
    try {
      const invitationUrl = `${appUrl}/invitation/${guest.qr_code}`
      
      const messageText = `🎉 *${event.name}*

Dear ${guest.name}, you're invited!

📥 *View & Download Your Invitation:*
${invitationUrl}

Click the link above to see event details and download your QR code.`

      // Format phone number for WhatsApp Business API
      // Required format: country code + number (no + sign, no spaces, no dashes)
      let formattedPhone = guest.phone.replace(/[+\s\-()]/g, '')
      
      // If phone doesn't start with country code, assume it's missing
      // Common issue: numbers like 03001234567 need country code
      if (formattedPhone.length < 10) {
        throw new Error(`Invalid phone number: ${guest.phone} (too short)`)
      }
      
      // If starts with 0, remove it (common in Pakistan/India)
      if (formattedPhone.startsWith('0')) {
        formattedPhone = formattedPhone.substring(1)
      }
      
      // If doesn't start with country code, try to detect
      // Pakistan: 92, India: 91, US: 1, etc.
      if (!formattedPhone.match(/^[1-9]\d{9,14}$/)) {
        // Invalid format - log but continue
        console.warn(`Phone number format issue: ${guest.phone} -> ${formattedPhone}`)
      }

      const response = await fetch(`${whatsappApiUrl}/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: {
            body: messageText
          }
        }),
      })

      if (response.ok) {
        results.push({ guest, success: true })
        
        // Update guest status
        await supabase.from('guests').update({
          invitation_sent: true,
          invitation_sent_at: new Date().toISOString()
        }).eq('id', guest.id)

        // Log success
        await supabase.from('whatsapp_logs').insert({
          guest_id: guest.id,
          event_id: eventId,
          message_type: 'invitation',
          status: 'sent',
          sent_at: new Date().toISOString()
        })
      } else {
        const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
        const errorMessage = errorData.error?.message || errorData.error?.error_user_msg || JSON.stringify(errorData)
        const errorCode = errorData.error?.code || errorData.error?.error_subcode || 'UNKNOWN'
        
        results.push({ 
          guest, 
          success: false, 
          error: `${errorCode}: ${errorMessage}` 
        })
        
        // Log failure with detailed error
        await supabase.from('whatsapp_logs').insert({
          guest_id: guest.id,
          event_id: eventId,
          message_type: 'invitation',
          status: 'failed',
          error_message: JSON.stringify({
            code: errorCode,
            message: errorMessage,
            phone: formattedPhone,
            original_phone: guest.phone,
            full_error: errorData
          })
        })
        
        console.error(`Failed to send to ${guest.name} (${formattedPhone}):`, errorData)
      }

      // Delay between messages to avoid rate limits (1 second delay)
      if (guests.indexOf(guest) < guests.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    } catch (error: any) {
      const errorMessage = error.message || error.toString() || 'Unknown error'
      results.push({ guest, success: false, error: errorMessage })
      
      // Log failure with details
      await supabase.from('whatsapp_logs').insert({
        guest_id: guest.id,
        event_id: eventId,
        message_type: 'invitation',
        status: 'failed',
        error_message: JSON.stringify({
          message: errorMessage,
          phone: guest.phone,
          error_type: error.name || 'Exception'
        })
      })
      
      console.error(`Exception sending to ${guest.name} (${guest.phone}):`, error)
    }
  }

  const successfulIds = results.filter(r => r.success).map(r => r.guest.id)

  return NextResponse.json({
    success: true,
    sent: successfulIds.length,
    failed: results.filter(r => !r.success).length,
    total: results.length,
    method: 'business_api',
    results: results.map(r => ({
      guest: r.guest.name,
      phone: r.guest.phone,
      success: r.success,
      error: r.error || null
    }))
  })
}

// Fallback to whatsapp-web.js (requires QR connection)
async function sendViaWhatsAppWeb(guests: any[], event: any, appUrl: string, eventId: string) {
  // Dynamic import to avoid build-time issues
  const { whatsappService } = await import('@/lib/whatsapp-web')
  
  // Check if WhatsApp is ready
  const status = whatsappService.getStatus()
  if (!status.isReady) {
    return NextResponse.json(
      { error: 'WhatsApp not connected. Please connect first or set up WhatsApp Business API credentials.' },
      { status: 400 }
    )
  }

  // Create message template
  const messageTemplate = `🎉 *${event.name}*

Dear {name}, you're invited!

📥 *View & Download Your Invitation:*
${appUrl}/invitation/{qr_code}

Click the link above to see event details and download your QR code.`

  // Send bulk messages (pass full guest objects)
  const results = await whatsappService.sendBulk(
    guests.map(g => ({
      id: g.id,
      phone: g.phone,
      name: g.name,
      qr_code: g.qr_code
    })),
    messageTemplate
  )

  // Update sent status for successful sends
  const successfulIds = results
    .filter(r => r.success)
    .map(r => (r.guest as any).id)
    .filter((id): id is string => id !== undefined)

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
    method: 'whatsapp_web',
    results: results.map(r => ({
      guest: (r.guest as any).name || r.guest.name,
      phone: r.guest.phone,
      success: r.success,
      error: (r as any).error || null
    }))
  })
}
