# WhatsApp API Credentials Setup Guide

## Overview

Your app currently uses **whatsapp-web.js** (free, unlimited) which doesn't require these credentials. However, if you want to use the **official WhatsApp Business API** (paid, more reliable), you'll need these credentials.

---

## Option 1: Current Setup (whatsapp-web.js) ✅ Recommended

**No credentials needed!** Your app uses `whatsapp-web.js` which:
- ✅ Free & Unlimited
- ✅ Works with your personal WhatsApp
- ✅ No API setup required
- ⚠️ Requires QR code scan to connect
- ⚠️ May need reconnection after server restart

**Current Status:** This is what you're using now. No `.env.local` changes needed.

---

## Option 2: Official WhatsApp Business API (Paid)

If you want to use Meta's official WhatsApp Business API, you need these credentials:

### Where to Get Credentials:

#### Step 1: Create Meta Business Account
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Sign in with your Facebook account
3. Click **"My Apps"** → **"Create App"**
4. Select **"Business"** as app type
5. Fill in app details and create

#### Step 2: Add WhatsApp Product
1. In your app dashboard, click **"Add Product"**
2. Find **"WhatsApp"** and click **"Set Up"**
3. Follow the setup wizard

#### Step 3: Get Phone Number ID
1. Go to **WhatsApp** → **API Setup**
2. You'll see **"Phone number ID"** - copy this
3. This is your `WHATSAPP_PHONE_NUMBER_ID`

#### Step 4: Get Access Token
1. In **WhatsApp** → **API Setup**
2. Find **"Temporary access token"** (for testing)
3. For production, create a **System User** token:
   - Go to **Business Settings** → **Users** → **System Users**
   - Create a new system user
   - Generate token with `whatsapp_business_messaging` permission
4. This is your `WHATSAPP_ACCESS_TOKEN`

#### Step 5: Get API URL
- Default: `https://graph.facebook.com/v18.0`
- Check latest version at [Meta API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)

---

## Environment Variables Setup

### For Local Development:

Create or update `.env.local` in your project root:

```env
# WhatsApp Business API (Optional - only if using official API)
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_ACCESS_TOKEN=your_access_token_here
```

### For Netlify Deployment:

1. Go to your Netlify dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add these variables:
   - `WHATSAPP_API_URL` = `https://graph.facebook.com/v18.0`
   - `WHATSAPP_PHONE_NUMBER_ID` = `your_phone_number_id`
   - `WHATSAPP_ACCESS_TOKEN` = `your_access_token`

---

## Pricing for Official API

**WhatsApp Business API Pricing:**
- **Free Tier:** 1,000 conversations/month (first 24 hours)
- **Paid:** After free tier, pay per conversation
- **Conversation Types:**
  - User-initiated: $0.005 - $0.01 per conversation
  - Business-initiated: $0.005 - $0.015 per conversation

**Note:** A "conversation" is a 24-hour window where you can send unlimited messages.

---

## Which Should You Use?

### Use whatsapp-web.js (Current) ✅
- ✅ Free & unlimited
- ✅ Easy setup (just scan QR)
- ✅ Works immediately
- ⚠️ Requires active connection
- ⚠️ May need reconnection

**Best for:** Small to medium events, personal use, testing

### Use Official API 💰
- ✅ More reliable
- ✅ No QR code needed
- ✅ Better for production
- ✅ Scales better
- ❌ Costs money after free tier
- ❌ More complex setup

**Best for:** Large events, production apps, high volume

---

## Current App Behavior

Your app (`src/app/api/send-whatsapp/route.ts`) checks for API credentials:

1. **If credentials exist:** Uses official WhatsApp Business API
2. **If no credentials:** Falls back to WhatsApp Web URL (manual sending)
3. **Bulk sending:** Uses `whatsapp-web.js` (current implementation)

---

## Need Help?

- [Meta WhatsApp API Docs](https://developers.facebook.com/docs/whatsapp)
- [WhatsApp Business API Setup](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [WhatsApp Pricing](https://developers.facebook.com/docs/whatsapp/pricing)

---

## Quick Reference

```env
# .env.local
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Where to find:**
- **Phone Number ID:** Meta App Dashboard → WhatsApp → API Setup
- **Access Token:** Meta App Dashboard → WhatsApp → API Setup → Temporary Token (or System User token)
- **API URL:** Always `https://graph.facebook.com/v18.0` (check for latest version)

