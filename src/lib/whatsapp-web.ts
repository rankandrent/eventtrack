import { Client, LocalAuth } from 'whatsapp-web.js'
import { EventEmitter } from 'events'

class WhatsAppService extends EventEmitter {
  private client: Client | null = null
  private isReady = false
  private isInitializing = false

  async initialize() {
    if (this.isInitializing || this.isReady) {
      return
    }

    this.isInitializing = true

    try {
      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: './.wwebjs_auth'
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        }
      })

      this.client.on('qr', (qr) => {
        this.emit('qr', qr)
      })

      this.client.on('ready', () => {
        this.isReady = true
        this.isInitializing = false
        this.emit('ready')
      })

      this.client.on('authenticated', () => {
        this.emit('authenticated')
      })

      this.client.on('auth_failure', (msg) => {
        this.isInitializing = false
        this.emit('auth_failure', msg)
      })

      this.client.on('disconnected', (reason) => {
        this.isReady = false
        this.emit('disconnected', reason)
      })

      await this.client.initialize()
    } catch (error) {
      this.isInitializing = false
      throw error
    }
  }

  async sendMessage(phone: string, message: string) {
    if (!this.client || !this.isReady) {
      throw new Error('WhatsApp not ready. Please connect first.')
    }

    // Clean phone number
    let cleanPhone = phone.replace(/\D/g, '')
    
    // Add country code if missing (assume Pakistan if starts with 0)
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '92' + cleanPhone.substring(1)
    }

    const number = `${cleanPhone}@c.us`
    
    try {
      const result = await this.client.sendMessage(number, message)
      return { success: true, messageId: result.id._serialized }
    } catch (error: any) {
      // Check if number is invalid
      if (error.message?.includes('not registered') || error.message?.includes('invalid')) {
        throw new Error(`Invalid WhatsApp number: ${phone}`)
      }
      throw error
    }
  }

  async sendBulk(
    guests: Array<{ phone: string; name: string; qr_code: string }>,
    messageTemplate: string,
    onProgress?: (current: number, total: number) => void
  ) {
    const results = []
    const total = guests.length

    for (let i = 0; i < guests.length; i++) {
      const guest = guests[i]
      
      try {
        // Replace placeholders in message
        let message = messageTemplate
          .replace(/{name}/g, guest.name)
          .replace(/{qr_code}/g, guest.qr_code)

        const result = await this.sendMessage(guest.phone, message)
        results.push({ guest, success: true, result })

        // Update progress
        if (onProgress) {
          onProgress(i + 1, total)
        }

        // Delay to avoid rate limiting (2 seconds between messages)
        if (i < guests.length - 1) {
          await new Promise(r => setTimeout(r, 2000))
        }
      } catch (error: any) {
        results.push({
          guest,
          success: false,
          error: error.message || 'Failed to send'
        })

        // Update progress even on failure
        if (onProgress) {
          onProgress(i + 1, total)
        }

        // Still delay on error
        if (i < guests.length - 1) {
          await new Promise(r => setTimeout(r, 1000))
        }
      }
    }

    return results
  }

  getStatus() {
    return {
      isReady: this.isReady,
      isInitializing: this.isInitializing
    }
  }

  async destroy() {
    if (this.client) {
      await this.client.destroy()
      this.client = null
      this.isReady = false
    }
  }
}

// Singleton instance
export const whatsappService = new WhatsAppService()

