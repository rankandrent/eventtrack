# WhatsApp API Credentials - Step by Step Guide (Urdu/English)

## ⚠️ IMPORTANT: Abhi Credentials Ki Zarurat Nahi!

**Aapka app abhi `whatsapp-web.js` use kar raha hai jo bilkul FREE hai aur credentials ki zarurat nahi!**

Agar aap **official WhatsApp Business API** use karna chahte ho (jo paid hai), tab ye credentials chahiye.

---

## 📍 Credentials Kahan Se Milenge?

### Step 1: Meta Developer Account Banao

1. **Website kholo:** https://developers.facebook.com/
2. **Facebook account se login karo**
3. **"My Apps"** button click karo (top right corner)
4. **"Create App"** button click karo

### Step 2: App Create Karo

1. **App type select karo:** "Business" select karo
2. **App name dalo:** Kuch bhi naam (e.g., "My Event App")
3. **Contact email dalo:** Apni email
4. **"Create App"** button click karo

### Step 3: WhatsApp Product Add Karo

1. App dashboard mein **"Add Product"** button dikhega
2. **"WhatsApp"** product dhundho
3. **"Set Up"** button click karo
4. Setup wizard follow karo

### Step 4: Phone Number ID Lein

1. Left sidebar mein **"WhatsApp"** click karo
2. **"API Setup"** tab click karo
3. Wahan **"Phone number ID"** dikhega (kuch aise: `123456789012345`)
4. **Copy karo** - ye aapka `WHATSAPP_PHONE_NUMBER_ID` hai

**Example:**
```
Phone number ID: 123456789012345
```

### Step 5: Access Token Lein

#### Option A: Temporary Token (Testing ke liye)

1. Same **"API Setup"** page pe
2. **"Temporary access token"** section mein token dikhega
3. **Copy karo** - ye aapka `WHATSAPP_ACCESS_TOKEN` hai

**Example:**
```
Temporary access token: EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Option B: Permanent Token (Production ke liye)

1. **Business Settings** → **Users** → **System Users**
2. **"Add"** button click karo
3. System user create karo
4. **"Generate New Token"** click karo
5. **Permissions select karo:** `whatsapp_business_messaging`
6. Token copy karo

### Step 6: API URL

**Ye fixed hai, copy karo:**
```
https://graph.facebook.com/v18.0
```

*(Note: Version number change ho sakta hai, latest check karo)*

---

## 📝 .env.local File Mein Add Karein

Project root mein `.env.local` file banao ya update karo:

```env
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Important:** 
- `123456789012345` ki jagah apna actual Phone Number ID dalo
- `EAAxxxxxxxx...` ki jagah apna actual Access Token dalo

---

## 🌐 Netlify Pe Deploy Karte Waqt

1. Netlify dashboard kholo
2. Apni site select karo
3. **Site settings** → **Environment variables**
4. 3 variables add karo:
   - `WHATSAPP_API_URL` = `https://graph.facebook.com/v18.0`
   - `WHATSAPP_PHONE_NUMBER_ID` = `apna_phone_number_id`
   - `WHATSAPP_ACCESS_TOKEN` = `apna_access_token`

---

## 💰 Pricing

**WhatsApp Business API:**
- **Free:** 1,000 conversations/month (pehle 24 hours)
- **Paid:** Uske baad per conversation charge
  - User-initiated: $0.005 - $0.01 per conversation
  - Business-initiated: $0.005 - $0.015 per conversation

**Note:** 1 conversation = 24 hours window jisme unlimited messages bhej sakte ho

---

## ✅ Current Status

**Aapka app abhi `whatsapp-web.js` use kar raha hai:**
- ✅ **Bilkul FREE**
- ✅ **Unlimited messages**
- ✅ **No credentials needed**
- ✅ **QR code scan se connect**

**Agar aap official API use karna chahte ho, tab hi credentials ki zarurat hai!**

---

## 🔗 Helpful Links

1. **Meta Developers:** https://developers.facebook.com/
2. **WhatsApp API Docs:** https://developers.facebook.com/docs/whatsapp
3. **Setup Guide:** https://developers.facebook.com/docs/whatsapp/cloud-api/get-started
4. **Pricing:** https://developers.facebook.com/docs/whatsapp/pricing

---

## 📸 Visual Guide Locations

### Phone Number ID:
```
Meta Dashboard → Your App → WhatsApp → API Setup
↓
Phone number ID: [YOUR_ID_HERE]
```

### Access Token:
```
Meta Dashboard → Your App → WhatsApp → API Setup
↓
Temporary access token: [YOUR_TOKEN_HERE]
```

### API URL:
```
Always: https://graph.facebook.com/v18.0
(Check for latest version)
```

---

## ❓ FAQ

**Q: Kya mujhe abhi credentials ki zarurat hai?**  
A: **Nahi!** Aapka app abhi whatsapp-web.js use kar raha hai jo free hai.

**Q: Credentials kahan se milenge?**  
A: Meta for Developers website se: https://developers.facebook.com/

**Q: Kya ye free hai?**  
A: Official API free nahi hai (1,000 conversations/month free, phir paid). whatsapp-web.js bilkul free hai.

**Q: Kaunsa better hai?**  
A: **whatsapp-web.js** - Free, unlimited, easy setup. Official API - Paid, more reliable, better for production.

---

## 🎯 Summary

1. **Meta for Developers** pe jao: https://developers.facebook.com/
2. **App create karo** (Business type)
3. **WhatsApp product add karo**
4. **API Setup** se Phone Number ID aur Access Token copy karo
5. **`.env.local`** mein add karo
6. **Done!**

**Remember:** Abhi credentials ki zarurat nahi kyunki aapka app whatsapp-web.js use kar raha hai! 🎉

