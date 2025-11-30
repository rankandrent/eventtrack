# Event QR Invitation System 🎉

A complete event invitation and check-in system that lets you send personalized WhatsApp invitations with unique QR codes and track attendance in real-time.

![Event QR Invitation System](https://via.placeholder.com/800x400/0d1f38/e8bc3c?text=Event+QR+Invitation+System)

## ✨ Features

- **📱 WhatsApp Invitations** - Send personalized invitations directly via WhatsApp
- **🎫 Unique QR Codes** - Each guest receives a unique, secure QR code
- **🔒 One-Time Scan** - QR codes can only be scanned once to prevent duplicate entries
- **📊 Real-Time Tracking** - Monitor attendance as guests check in with live updates
- **📤 Excel Import/Export** - Bulk import guests from Excel and export data
- **📈 Analytics Dashboard** - View insights across all your events

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account (database is already configured)

### Installation

1. **Clone and install dependencies:**

```bash
cd clikent
npm install
```

2. **Set up environment variables:**

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ncsxlqpwiaixnsvjtlgc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jc3hscXB3aWFpeG5zdmp0bGdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NDIyMTIsImV4cCI6MjA3NzMxODIxMn0.Ru8LJvYuVbzoPyqgedqo2aw4EBLRtha1F9DokFvHjaU

# Optional: WhatsApp Business API (for automated sending)
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token

# App URL for QR code links
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Run the development server:**

```bash
npm run dev
```

4. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## 📖 How to Use

### 1. Create an Event

1. Go to the Admin Dashboard (`/admin`)
2. Click "Create Event"
3. Fill in event details (name, date, time, venue)
4. Save the event

### 2. Add Guests

You can add guests in two ways:

**Manual Entry:**
1. Open your event
2. Click "Add Guest"
3. Enter name and phone number

**Excel Import:**
1. Prepare an Excel file with columns: `Name`, `Phone`, `Email` (optional)
2. Click "Import Excel"
3. Select your file

### 3. Send Invitations

**Individual:**
- Click the send (📤) icon next to each guest

**Bulk:**
- Click "Send All Invites" to send to all un-invited guests

The system will open WhatsApp Web with a pre-filled message containing:
- Event details
- Personal QR code link
- Venue information

### 4. Check-In Guests

1. Go to the Check-In page (`/checkin`)
2. Use the camera to scan QR codes
3. Or enter codes manually

**Check-in Features:**
- ✅ Shows success for valid, first-time scans
- ⚠️ Warns if already checked in
- ❌ Rejects invalid codes
- 📊 Live attendance counter

### 5. Track Attendance

- View real-time stats on the event page
- Check the Analytics dashboard for insights
- Export guest lists to Excel

## 🎨 Pages Overview

| Page | URL | Description |
|------|-----|-------------|
| Home | `/` | Landing page |
| Admin Dashboard | `/admin` | Overview of all events |
| Events List | `/admin/events` | Manage all events |
| Create Event | `/admin/events/new` | Create a new event |
| Event Details | `/admin/events/[id]` | Manage specific event & guests |
| All Guests | `/admin/guests` | View guests across all events |
| Analytics | `/admin/analytics` | Stats and insights |
| Check-In | `/checkin` | QR code scanner |
| Invitation | `/invite/[code]` | Guest's invitation page |

## 📱 WhatsApp Integration

### Option 1: WhatsApp Web (Default)

The system opens WhatsApp Web with a pre-filled message. You just need to click send.

### Option 2: WhatsApp Business API (Optional)

For fully automated sending, configure the WhatsApp Business API:

1. Create a Meta Business account
2. Set up WhatsApp Business API
3. Create a message template
4. Add credentials to `.env.local`

## 🗄️ Database Schema

The system uses the following tables:

- **events** - Event details (name, date, venue, etc.)
- **guests** - Guest information with unique QR codes
- **checkin_logs** - Audit trail of all scan attempts
- **whatsapp_logs** - Message sending history

## 🔒 Security Features

- **Unique QR codes** - Each guest has a cryptographically unique code
- **One-time validation** - Prevents duplicate check-ins
- **Audit logging** - All scan attempts are recorded
- **Row-level security** - Database is protected with RLS policies

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React, TypeScript
- **Styling:** Tailwind CSS, Framer Motion
- **Database:** Supabase (PostgreSQL)
- **QR Codes:** qrcode, html5-qrcode
- **Excel:** xlsx library

## 📝 Excel Format

For bulk import, use this format:

| Name | Phone | Email |
|------|-------|-------|
| John Doe | 03001234567 | john@email.com |
| Jane Smith | +923009876543 | jane@email.com |

**Phone number formats accepted:**
- `03001234567` (local)
- `+923001234567` (international)
- `923001234567` (without +)

## 🤝 Support

For issues or questions, please open an issue in the repository.

## 📄 License

MIT License - feel free to use for your events!

