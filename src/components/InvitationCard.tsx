'use client'

import { useEffect, useRef, useState } from 'react'
import { Event, Guest } from '@/lib/supabase'
import { formatDate, formatTime, getAppUrl } from '@/lib/utils'
import { Calendar, Clock, MapPin, QrCode } from 'lucide-react'
import QRCodeLib from 'qrcode'

interface InvitationCardProps {
  guest: Guest
  event: Event
  onImageReady?: (dataUrl: string) => void
}

export function InvitationCard({ guest, event, onImageReady }: InvitationCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  useEffect(() => {
    generateCard()
  }, [guest, event])

  async function generateCard() {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Canvas size (optimized for WhatsApp)
    const width = 600
    const height = 800
    canvas.width = width
    canvas.height = height

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#0d1f38')
    gradient.addColorStop(1, '#080f1c')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Decorative circles
    ctx.fillStyle = 'rgba(232, 188, 60, 0.1)'
    ctx.beginPath()
    ctx.arc(100, 150, 150, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = 'rgba(232, 188, 60, 0.05)'
    ctx.beginPath()
    ctx.arc(500, 650, 200, 0, Math.PI * 2)
    ctx.fill()

    // Border
    ctx.strokeStyle = 'rgba(232, 188, 60, 0.3)'
    ctx.lineWidth = 2
    ctx.strokeRect(20, 20, width - 40, height - 40)

    // Inner border
    ctx.strokeStyle = 'rgba(232, 188, 60, 0.15)'
    ctx.lineWidth = 1
    ctx.strokeRect(30, 30, width - 60, height - 60)

    // "You're Invited" text
    ctx.fillStyle = '#e8bc3c'
    ctx.font = 'italic 24px Georgia, serif'
    ctx.textAlign = 'center'
    ctx.fillText("You're Invited", width / 2, 80)

    // Event name
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 32px Arial, sans-serif'
    const eventName = event.name.length > 25 ? event.name.substring(0, 25) + '...' : event.name
    ctx.fillText(eventName, width / 2, 130)

    // Divider line
    ctx.strokeStyle = 'rgba(232, 188, 60, 0.5)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(150, 160)
    ctx.lineTo(450, 160)
    ctx.stroke()

    // Guest name
    ctx.fillStyle = '#e8bc3c'
    ctx.font = '20px Arial, sans-serif'
    ctx.fillText('Dear', width / 2, 200)
    
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 28px Arial, sans-serif'
    ctx.fillText(guest.name, width / 2, 235)

    // Event details
    const detailsY = 290
    ctx.font = '18px Arial, sans-serif'
    ctx.fillStyle = '#9ca3af'
    
    // Date
    ctx.fillText('📅  ' + formatDate(event.event_date), width / 2, detailsY)
    
    // Time
    ctx.fillText('⏰  ' + formatTime(event.event_date), width / 2, detailsY + 35)
    
    // Venue
    const venue = event.venue.length > 35 ? event.venue.substring(0, 35) + '...' : event.venue
    ctx.fillText('📍  ' + venue, width / 2, detailsY + 70)

    // Generate QR Code - Always use production URL
    const appUrl = getAppUrl()
    const checkInUrl = `${appUrl}/checkin?code=${guest.qr_code}`
    
    try {
      const qrDataUrl = await QRCodeLib.toDataURL(checkInUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#0d1f38', light: '#ffffff' }
      })
      
      setQrDataUrl(qrDataUrl)

      // Draw QR code
      const qrImage = new Image()
      qrImage.onload = () => {
        // White background for QR
        ctx.fillStyle = '#ffffff'
        roundRect(ctx, width / 2 - 110, 390, 220, 220, 15)
        ctx.fill()
        
        // QR code
        ctx.drawImage(qrImage, width / 2 - 100, 400, 200, 200)

        // QR label
        ctx.fillStyle = '#9ca3af'
        ctx.font = '14px Arial, sans-serif'
        ctx.fillText('Scan at entrance for check-in', width / 2, 640)

        // Code text
        ctx.fillStyle = '#6b7280'
        ctx.font = '12px monospace'
        ctx.fillText(guest.qr_code, width / 2, 665)

        // Footer
        ctx.fillStyle = 'rgba(232, 188, 60, 0.8)'
        ctx.font = 'italic 16px Georgia, serif'
        ctx.fillText('We look forward to seeing you!', width / 2, 720)

        if (event.host_name) {
          ctx.fillStyle = '#9ca3af'
          ctx.font = '14px Arial, sans-serif'
          ctx.fillText('- ' + event.host_name, width / 2, 750)
        }

        // Get the final image
        const finalDataUrl = canvas.toDataURL('image/png')
        if (onImageReady) {
          onImageReady(finalDataUrl)
        }
      }
      qrImage.src = qrDataUrl
    } catch (error) {
      console.error('Error generating QR:', error)
    }
  }

  return (
    <canvas 
      ref={canvasRef} 
      className="hidden"
      width={600}
      height={800}
    />
  )
}

// Helper function to draw rounded rectangle
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

// Function to generate invitation image
export async function generateInvitationImage(guest: Guest, event: Event): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject('Cannot create canvas context')
      return
    }

    // Canvas size
    const width = 600
    const height = 800
    canvas.width = width
    canvas.height = height

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#0d1f38')
    gradient.addColorStop(1, '#080f1c')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Decorative circles
    ctx.fillStyle = 'rgba(232, 188, 60, 0.1)'
    ctx.beginPath()
    ctx.arc(100, 150, 150, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = 'rgba(232, 188, 60, 0.05)'
    ctx.beginPath()
    ctx.arc(500, 650, 200, 0, Math.PI * 2)
    ctx.fill()

    // Border
    ctx.strokeStyle = 'rgba(232, 188, 60, 0.3)'
    ctx.lineWidth = 2
    ctx.strokeRect(20, 20, width - 40, height - 40)

    // "You're Invited" text
    ctx.fillStyle = '#e8bc3c'
    ctx.font = 'italic 24px Georgia, serif'
    ctx.textAlign = 'center'
    ctx.fillText("✨ You're Invited ✨", width / 2, 80)

    // Event name
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 28px Arial, sans-serif'
    const eventName = event.name.length > 28 ? event.name.substring(0, 28) + '...' : event.name
    ctx.fillText(eventName, width / 2, 130)

    // Divider
    ctx.strokeStyle = 'rgba(232, 188, 60, 0.5)'
    ctx.beginPath()
    ctx.moveTo(150, 155)
    ctx.lineTo(450, 155)
    ctx.stroke()

    // Guest name
    ctx.fillStyle = '#e8bc3c'
    ctx.font = '18px Arial, sans-serif'
    ctx.fillText('Dear', width / 2, 195)
    
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 26px Arial, sans-serif'
    ctx.fillText(guest.name, width / 2, 230)

    // Event details
    ctx.font = '16px Arial, sans-serif'
    ctx.fillStyle = '#d1d5db'
    
    ctx.fillText('📅  ' + formatDate(event.event_date), width / 2, 285)
    ctx.fillText('⏰  ' + formatTime(event.event_date), width / 2, 315)
    
    const venue = event.venue.length > 40 ? event.venue.substring(0, 40) + '...' : event.venue
    ctx.fillText('📍  ' + venue, width / 2, 345)

    // Generate QR Code - Always use production URL
    const appUrl = getAppUrl()
    const checkInUrl = `${appUrl}/checkin?code=${guest.qr_code}`

    QRCodeLib.toDataURL(checkInUrl, {
      width: 200,
      margin: 2,
      color: { dark: '#0d1f38', light: '#ffffff' }
    }).then(qrDataUrl => {
      const qrImage = new Image()
      qrImage.onload = () => {
        // White background for QR
        ctx.fillStyle = '#ffffff'
        roundRect(ctx, width / 2 - 115, 380, 230, 230, 15)
        ctx.fill()
        
        // QR code
        ctx.drawImage(qrImage, width / 2 - 100, 395, 200, 200)

        // QR label
        ctx.fillStyle = '#9ca3af'
        ctx.font = '14px Arial, sans-serif'
        ctx.fillText('Show this QR at entrance', width / 2, 640)

        // Code
        ctx.fillStyle = '#6b7280'
        ctx.font = '11px monospace'
        ctx.fillText('Code: ' + guest.qr_code, width / 2, 660)

        // Footer
        ctx.fillStyle = '#e8bc3c'
        ctx.font = 'italic 16px Georgia, serif'
        ctx.fillText('We look forward to seeing you!', width / 2, 720)

        if (event.host_name) {
          ctx.fillStyle = '#9ca3af'
          ctx.font = '14px Arial, sans-serif'
          ctx.fillText('— ' + event.host_name, width / 2, 750)
        }

        resolve(canvas.toDataURL('image/png'))
      }
      qrImage.onerror = reject
      qrImage.src = qrDataUrl
    }).catch(reject)
  })
}

