# WhatsApp Business API - Common Errors & Solutions

## ❌ "3 messages failed to send" - Common Causes

### 1. **Invalid Phone Number Format** 🔢

**Error:** Phone number format incorrect

**Solution:**
- Phone number must be: `Country Code + Number` (no + sign, no spaces)
- Example: `923001234567` (Pakistan), `911234567890` (India), `11234567890` (US)
- ❌ Wrong: `+923001234567`, `03001234567`, `92 300 1234567`
- ✅ Correct: `923001234567`

**Fix:**
- Ensure phone numbers include country code
- Remove leading zeros (e.g., `03001234567` → `923001234567`)

---

### 2. **Phone Number Not on WhatsApp** 📱

**Error:** `131047` - Recipient phone number not in WhatsApp

**Solution:**
- The phone number must have WhatsApp installed and active
- Verify the number is correct
- Ask the guest to check their WhatsApp

---

### 3. **Rate Limiting** ⏱️

**Error:** `429` - Too many requests

**Solution:**
- Current delay: 1 second between messages
- If still getting errors, increase delay to 2-3 seconds
- WhatsApp Business API has limits:
  - **Free tier:** 1,000 conversations/month
  - **Rate limit:** ~80 messages/second (varies)

---

### 4. **Invalid Access Token** 🔑

**Error:** `190` - Invalid OAuth access token

**Solution:**
- Token might be expired
- Generate new token from Meta App Dashboard
- Update `.env.local` with new token

---

### 5. **Phone Number ID Mismatch** 🆔

**Error:** `100` - Invalid parameter

**Solution:**
- Verify `WHATSAPP_PHONE_NUMBER_ID` is correct
- Check in Meta App Dashboard → WhatsApp → API Setup

---

### 6. **Business Account Not Approved** ✅

**Error:** `131026` - Message failed to send

**Solution:**
- WhatsApp Business Account must be approved
- Check account status in Meta Business Suite
- Complete business verification if needed

---

### 7. **Message Content Issues** 📝

**Error:** Message contains invalid characters

**Solution:**
- Some special characters might cause issues
- Emojis are usually fine
- Avoid very long messages (>4096 characters)

---

## 🔍 How to Debug Failed Messages

### Step 1: Check Error Logs

1. Go to your Supabase dashboard
2. Open `whatsapp_logs` table
3. Filter by `status = 'failed'`
4. Check `error_message` column for details

### Step 2: Check Console

1. Open browser console (F12)
2. Look for error messages
3. Check network tab for API responses

### Step 3: Verify Phone Numbers

1. Check guest phone numbers format
2. Ensure country code is included
3. Remove spaces, dashes, parentheses

---

## ✅ Quick Fixes

### Fix Phone Number Format

```javascript
// Current format in code
let formattedPhone = guest.phone.replace(/[+\s\-()]/g, '')

// If starts with 0, remove it
if (formattedPhone.startsWith('0')) {
  formattedPhone = formattedPhone.substring(1)
}
```

### Common Country Codes

- Pakistan: `92`
- India: `91`
- USA: `1`
- UK: `44`
- UAE: `971`

---

## 📊 Error Codes Reference

| Code | Meaning | Solution |
|------|---------|----------|
| `131047` | Phone not on WhatsApp | Verify number |
| `131026` | Message failed | Check business account |
| `190` | Invalid token | Regenerate token |
| `100` | Invalid parameter | Check phone format |
| `429` | Rate limit | Increase delay |
| `80007` | Spam detected | Review message content |

---

## 🛠️ Testing

### Test Single Message

1. Add one guest with correct phone format
2. Click "Send" button
3. Check if message sends successfully
4. If fails, check error message

### Test Bulk Send

1. Add 2-3 test guests
2. Click "Send All"
3. Monitor progress
4. Check which ones fail and why

---

## 💡 Best Practices

1. **Always include country code** in phone numbers
2. **Verify phone numbers** before adding guests
3. **Test with 1-2 messages** before bulk sending
4. **Monitor error logs** regularly
5. **Keep access token updated**

---

## 📞 Need Help?

If errors persist:
1. Check Supabase `whatsapp_logs` table
2. Verify credentials in `.env.local`
3. Test with a known working phone number
4. Check Meta Business Suite for account status

