import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateQRCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const timestamp = Date.now().toString(36)
  let random = ''
  for (let i = 0; i < 12; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `EVT-${timestamp}-${random}`
}

export function formatPhone(phone: string): string {
  // Remove all characters except digits and +
  let cleaned = phone.replace(/[^\d+]/g, '')
  
  // If starts with +, keep it and get just digits after
  if (cleaned.startsWith('+')) {
    return cleaned.replace(/[^\d]/g, '') // Remove + for WhatsApp API format
  }
  
  // If it's just digits, return as-is (user should include country code)
  return cleaned
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatTime(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} at ${formatTime(date)}`
}
