import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { guestId, eventId } = await request.json()

    // Get current user from session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get event - verify ownership
    const eventRes = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('user_id', userId)  // CRITICAL: Only allow if user owns this event
      .single()

    if (eventRes.error || !eventRes.data) {
      return NextResponse.json({ error: 'Event not found or access denied' }, { status: 404 })
    }

    const event = eventRes.data

    // Get guest for this event
    const guestRes = await supabase
      .from('guests')
      .select('*')
      .eq('id', guestId)
      .eq('event_id', eventId)  // Only guests for this event
      .single()

    if (guestRes.error || !guestRes.data) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
    }

    const guest = guestRes.data
    // Always use production URL
    const appUrl = 'https://invite-event.netlify.app'
    const checkInUrl = `${appUrl}/checkin?code=${guest.qr_code}`

    // If WhatsApp Business API credentials are configured, use them
    const whatsappApiUrl = process.env.WHATSAPP_API_URL
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

    if (whatsappApiUrl && phoneNumberId && accessToken && accessToken !== 'your_access_token') {
      // Prepare message content
      const messageText = `🎉 *You're Invited!*

Dear ${guest.name},

You are cordially invited to *${event.name}*

📅 *Date:* ${new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
⏰ *Time:* ${new Date(event.event_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
📍 *Venue:* ${event.venue}
${event.venue_address ? `\n📌 *Address:* ${event.venue_address}` : ''}

Your personal check-in link:
${checkInUrl}

Please show your QR code at the entrance for quick check-in.

${event.host_name ? `Looking forward to seeing you!\n\n- ${event.host_name}` : ''}`.trim()

      // Format phone number (remove + and spaces)
      const formattedPhone = guest.phone.replace(/[+\s]/g, '')

      // Try sending via WhatsApp Business API (text message)
      let response
      try {
        response = await fetch(`${whatsappApiUrl}/${phoneNumberId}/messages`, {
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
      } catch (fetchError: any) {
        console.error('WhatsApp API fetch error:', fetchError)
        
        // Log failed attempt
        await supabase.from('whatsapp_logs').insert({
          guest_id: guestId,
          event_id: eventId,
          message_type: 'invitation',
          status: 'failed',
          error_message: fetchError.message || 'Network error',
        })

        return NextResponse.json({ 
          error: 'Failed to connect to WhatsApp API',
          fallback: true 
        }, { status: 500 })
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('WhatsApp API error:', error)
        
        // Log failed attempt
        await supabase.from('whatsapp_logs').insert({
          guest_id: guestId,
          event_id: eventId,
          message_type: 'invitation',
          status: 'failed',
          error_message: JSON.stringify(error),
        })

        // Return error but allow fallback to WhatsApp Web
        return NextResponse.json({ 
          error: 'WhatsApp API failed. Use WhatsApp Web instead.',
          fallback: true,
          details: error 
        }, { status: 500 })
      }

      // Update guest status
      await supabase.from('guests').update({
        invitation_sent: true,
        invitation_sent_at: new Date().toISOString(),
      }).eq('id', guestId)

      // Log success
      await supabase.from('whatsapp_logs').insert({
        guest_id: guestId,
        event_id: eventId,
        message_type: 'invitation',
        status: 'sent',
        sent_at: new Date().toISOString(),
      })

      return NextResponse.json({ success: true, method: 'api' })
    }

    // If no API credentials, return the WhatsApp Web URL for manual sending
    const message = `🎉 *You're Invited!*

Dear ${guest.name},

You are cordially invited to *${event.name}*

📅 *Date:* ${new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
⏰ *Time:* ${new Date(event.event_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
📍 *Venue:* ${event.venue}
${event.venue_address ? `\n📌 *Address:* ${event.venue_address}` : ''}

Your personal check-in link:
${checkInUrl}

Please show your QR code at the entrance for quick check-in.

${event.host_name ? `Looking forward to seeing you!\n\n- ${event.host_name}` : ''}`.trim()

    const whatsappWebUrl = `https://wa.me/${guest.phone}?text=${encodeURIComponent(message)}`

    return NextResponse.json({ 
      success: true, 
      method: 'web',
      url: whatsappWebUrl,
      message
    })

  } catch (error) {
    console.error('Error in send-whatsapp:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

