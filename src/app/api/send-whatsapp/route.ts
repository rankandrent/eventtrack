import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { guestId, eventId } = await request.json()

    // Get guest and event details
    const [guestRes, eventRes] = await Promise.all([
      supabase.from('guests').select('*').eq('id', guestId).single(),
      supabase.from('events').select('*').eq('id', eventId).single()
    ])

    if (guestRes.error || eventRes.error) {
      return NextResponse.json({ error: 'Guest or event not found' }, { status: 404 })
    }

    const guest = guestRes.data
    const event = eventRes.data
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const checkInUrl = `${appUrl}/checkin?code=${guest.qr_code}`

    // If WhatsApp Business API credentials are configured, use them
    const whatsappApiUrl = process.env.WHATSAPP_API_URL
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

    if (whatsappApiUrl && phoneNumberId && accessToken && accessToken !== 'your_access_token') {
      // Send via WhatsApp Business API
      const response = await fetch(`${whatsappApiUrl}/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: guest.phone,
          type: 'template',
          template: {
            name: 'event_invitation',
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: guest.name },
                  { type: 'text', text: event.name },
                  { type: 'text', text: new Date(event.event_date).toLocaleDateString() },
                  { type: 'text', text: new Date(event.event_date).toLocaleTimeString() },
                  { type: 'text', text: event.venue },
                  { type: 'text', text: checkInUrl },
                ],
              },
            ],
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('WhatsApp API error:', error)
        
        // Log failed attempt
        await supabase.from('whatsapp_logs').insert({
          guest_id: guestId,
          event_id: eventId,
          message_type: 'invitation',
          status: 'failed',
          error_message: JSON.stringify(error),
        })

        return NextResponse.json({ error: 'Failed to send WhatsApp message' }, { status: 500 })
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

