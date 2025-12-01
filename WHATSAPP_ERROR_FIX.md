# WhatsApp API Error Fix Guide

## Error: "Object with ID '15551735482' does not exist"

### Problem
Ye error tab aata hai jab:
- Phone Number ID galat hai
- Phone Number ID Access Token ke saath match nahi kar raha
- Permissions missing hain

---

## ✅ Solution Steps

### Step 1: Verify Phone Number ID

1. **Meta App Dashboard** kholo:
   - https://developers.facebook.com/apps/
   - Apni app select karo

2. **WhatsApp → API Setup** pe jao

3. **Phone number ID** copy karo
   - Ye ID wahi honi chahiye jo `.env.local` mein hai
   - Format: Numbers only (e.g., `123456789012345`)

4. **Verify:**
   - `.env.local` mein jo ID hai, wahi Meta Dashboard se match karo
   - Agar different hai, to update karo

---

### Step 2: Verify Access Token

1. **Same API Setup page** pe
2. **Temporary access token** check karo
3. **Agar expired hai**, to naya token generate karo:
   - "Generate New Token" click karo
   - Token copy karo
   - `.env.local` mein update karo

---

### Step 3: Check Permissions

1. **Business Settings** → **Users** → **System Users**
2. Apna system user select karo
3. **Permissions** check karo:
   - `whatsapp_business_messaging` permission honi chahiye
   - Agar nahi hai, to add karo

---

### Step 4: Verify Phone Number is Linked

1. **WhatsApp Manager** kholo:
   - https://business.facebook.com/
   - WhatsApp Manager → Phone Numbers

2. **Apna phone number** verify karo:
   - Phone number verified hona chahiye
   - Phone Number ID same honi chahiye

---

### Step 5: Update .env.local

```env
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=123456789012345   # ← Correct ID yahan dalo
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxx  # ← Correct token yahan dalo
```

**Important:**
- Phone Number ID: Meta Dashboard se exact copy karo
- Access Token: Fresh token use karo (expired nahi hona chahiye)

---

## Common Issues & Fixes

### Issue 1: Wrong Phone Number ID
**Error:** `Object with ID '15551735482' does not exist`

**Fix:**
- Meta Dashboard → WhatsApp → API Setup
- Correct Phone Number ID copy karo
- `.env.local` mein update karo

---

### Issue 2: Expired Access Token
**Error:** `Invalid access token` or `190: Invalid OAuth access token`

**Fix:**
- Meta Dashboard → WhatsApp → API Setup
- New token generate karo
- `.env.local` mein update karo

---

### Issue 3: Missing Permissions
**Error:** `Missing permissions` or `does not support this operation`

**Fix:**
- Business Settings → System Users
- `whatsapp_business_messaging` permission add karo
- New token generate karo with permissions

---

### Issue 4: Phone Number Not Verified
**Error:** `Phone number not verified`

**Fix:**
- WhatsApp Manager → Phone Numbers
- Phone number verify karo
- Verification code SMS se aayega

---

## Quick Checklist

- [ ] Phone Number ID Meta Dashboard se match karti hai
- [ ] Access Token fresh hai (expired nahi)
- [ ] `whatsapp_business_messaging` permission hai
- [ ] Phone number verified hai
- [ ] `.env.local` file correct values ke saath updated hai
- [ ] App restart kiya hai (agar localhost pe ho)

---

## Test After Fix

1. `.env.local` file save karo
2. App restart karo (agar localhost pe ho)
3. Netlify pe deploy karo (agar production pe ho)
4. Test message send karo
5. Agar abhi bhi error aaye, to error message check karo

---

## Still Not Working?

Agar abhi bhi issue hai, to ye check karo:

1. **API Version:**
   - `WHATSAPP_API_URL` latest version use kar raha hai?
   - Check: https://developers.facebook.com/docs/whatsapp/cloud-api

2. **Business Account:**
   - WhatsApp Business Account properly set up hai?
   - Business verification complete hai?

3. **Rate Limits:**
   - Too many requests to nahi bhej rahe?
   - 1 second delay between messages hai

4. **Phone Number Format:**
   - Guest phone numbers correct format mein hain?
   - Country code included hai?

---

## Need More Help?

- [Meta WhatsApp API Docs](https://developers.facebook.com/docs/whatsapp)
- [WhatsApp Business API Setup](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/) - Test API calls

---

## Summary

**Main Issue:** Phone Number ID `15551735482` invalid hai ya permissions missing hain.

**Quick Fix:**
1. Meta Dashboard → WhatsApp → API Setup
2. Correct Phone Number ID copy karo
3. Fresh Access Token generate karo
4. `.env.local` update karo
5. App restart karo

**Result:** Messages automatically send ho jayenge! ✅

