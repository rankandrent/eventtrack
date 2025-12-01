import { EventEmitter } from 'events'

// This service only works server-side
if (typeof window !== 'undefined') {
  throw new Error('WhatsApp service can only run on server-side')
}

class WhatsAppService extends EventEmitter {
  private client: any = null
  private isReady = false
  private isInitializing = false
  private Client: any = null
  private LocalAuth: any = null

  private getSessionPath() {
    // Check for custom path from environment
    if (process.env.WHATSAPP_SESSION_PATH) {
      return process.env.WHATSAPP_SESSION_PATH
    }
    
    // Use /tmp in serverless environments (Netlify, Vercel, AWS Lambda)
    // Note: /tmp is ephemeral - sessions won't persist between function invocations
    if (process.env.NETLIFY || process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      return '/tmp/.wwebjs_auth'
    }
    
    // Use local path for development
    return './.wwebjs_auth'
  }

  private async loadWhatsAppWeb() {
    if (!this.Client) {
      const whatsappWeb = await import('whatsapp-web.js')
      this.Client = whatsappWeb.Client
      this.LocalAuth = whatsappWeb.LocalAuth
    }
    return { Client: this.Client, LocalAuth: this.LocalAuth }
  }

  async initialize() {
    if (this.isInitializing || this.isReady) {
      return
    }

    this.isInitializing = true

    try {
      // Load WhatsApp Web.js dynamically
      const { Client, LocalAuth } = await this.loadWhatsAppWeb()
      
      const sessionPath = this.getSessionPath()
      
      // Ensure directory exists (recursive will create all parent dirs)
      try {
        const fs = await import('fs')
        if (!fs.existsSync(sessionPath)) {
          fs.mkdirSync(sessionPath, { recursive: true, mode: 0o755 })
        }
      } catch (e: any) {
        // Directory might already exist or creation failed
        // LocalAuth will handle directory creation as fallback
        console.log('Session directory setup:', e.message || 'Using default')
      }
      
      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: sessionPath
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

      this.client.on('qr', (qr: string) => {
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

      this.client.on('auth_failure', (msg: string) => {
        this.isInitializing = false
        this.emit('auth_failure', msg)
      })

      this.client.on('disconnected', (reason: string) => {
        this.isReady = false
        this.emit('disconnected', reason)
      })

      await this.client.initialize()
    } catch (error: any) {
      this.isInitializing = false
      
      // Provide helpful error messages
      if (error.message?.includes('ENOENT') || error.message?.includes('mkdir')) {
        throw new Error(
          'Cannot create session directory. ' +
          'In serverless environments, WhatsApp sessions may not persist. ' +
          'Consider using a dedicated server or database-backed sessions.'
        )
      }
      
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
    guests: Array<{ id?: string; phone: string; name: string; qr_code: string }>,
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
