🚨 RESQORA — Emergency Response Platform

Your Emergency. Our Response.

RESQORA is a modern, AI-powered emergency response platform designed to connect people, guardians, medical assistance, emergency services, and real-time location during critical situations.

Instead of being just an SOS button, RESQORA provides a complete emergency-response workflow—from accident reporting and AI assistance to live tracking and guardian coordination.

🌟 Key Features
🚨 Emergency SOS

Activate an emergency session with one tap.

When SOS is triggered, RESQORA can:

Capture the user's real-time location
Generate a unique Emergency ID
Start live location tracking
Notify the user's Guardian and emergency contacts
Send emergency email alerts
Generate an emergency timeline
Recommend nearby emergency services
Provide a secure Guardian Dashboard
🧠 RESQ AI — AI Medical Assistant

An AI-powered emergency assistant designed to provide guidance during stressful situations.

Features include:

💬 Text-based conversation
🎙️ Voice interaction
🔊 AI voice responses
🌐 English, Hindi and Telugu
🩺 First-aid guidance
🚨 Emergency guidance
📷 Accident/incident analysis where supported

Important: RESQ AI provides AI-assisted information and does not replace qualified medical professionals or emergency services.

🆔 RESQR ID

Every registered user receives a unique RESQR Emergency ID.

A secure QR code allows authorized responders to quickly access essential emergency information without exposing unnecessary private data.

Possible information includes:

Name
Blood group
Allergies
Medical conditions
Current medicines
Emergency contacts
Guardian information

Private information is protected through authorization and secure access controls.

👨‍👩‍👧 Guardian Dashboard

A dedicated emergency command center for authorized guardians.

During an active emergency, the Guardian Dashboard can display:

🔴 Emergency status
📍 Live location
🗺️ Map
🕒 Emergency timeline
🆔 Emergency ID
🩺 Medical summary
🤖 AI emergency assessment
🏥 Recommended emergency facility
📞 Emergency actions

Location updates are designed to occur in real time while an emergency session is active.

📷 AI Accident Response

Users can report an accident using:

Photos
Videos
Real GPS location

The system can analyze the submitted incident and provide:

Estimated severity
Visible hazards
Possible visible injuries
First-aid guidance
Emergency recommendations
Suitable nearby emergency facilities

Users can quickly:

Call 108 → Call Police → Navigate → Activate SOS

📍 Nearby Emergency Services

RESQORA uses the user's location to find relevant nearby services such as:

🏥 Hospitals
🚑 Ambulance services
🚓 Police stations
🚒 Fire stations
🩸 Blood banks

Each service can provide actions such as:

Call | Navigate | View on Maps

📧 Emergency Email Alerts

When SOS is activated, RESQORA can send emergency alerts to the user's configured:

Guardian
Emergency contacts

The email can contain:

User name
Emergency ID
Current address
Time
Google Maps location
Secure Guardian Dashboard link
Emergency status

Recipients are dynamically selected from the user's own emergency contacts rather than a global administrator.

📱 Installable PWA

RESQORA is designed as a Progressive Web App (PWA).

It can be installed on supported:

Android devices
iPhone/iPad
Windows PCs
macOS
Chrome
Edge
Safari

The installed application uses RESQORA branding and can launch in standalone app mode where supported.

🏗️ System Architecture
                    ┌─────────────────────┐
                    │      RESQORA        │
                    │   Emergency App     │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
        🚨 SOS            🧠 RESQ AI        📷 Accident
             │                 │                 │
             ▼                 ▼                 ▼
       Live Location      AI Guidance       AI Analysis
             │                 │                 │
             └─────────────────┼─────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │ Emergency Session   │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             ▼                 ▼                 ▼
        👨‍👩‍👧 Guardian       📧 Email         📍 Services
        Dashboard            Alerts            & Maps
🛠️ Technology Stack
Frontend
React
TypeScript
Vite
Responsive UI
Progressive Web App (PWA)
Backend & Database
Supabase
PostgreSQL
Supabase Authentication
Supabase Realtime
Supabase Storage
Row Level Security (RLS)
Communication
EmailJS
Firebase Cloud Messaging where configured
Browser Notifications
WhatsApp sharing
Location
Browser Geolocation API
Google Maps
Real-time location updates
AI
AI-powered emergency assistance
Accident/incident analysis
Multilingual assistance
🔐 Security & Privacy

RESQORA handles sensitive emergency information carefully.

The system is designed to protect:

Medical information
Emergency contacts
Guardian information
Live location
Emergency sessions
Authentication data

Security principles include:

Supabase Row Level Security
Authenticated access
Guardian authorization
Secure emergency sessions
Limited QR information
No unnecessary private information in URLs
⚡ Emergency Workflow
User activates SOS
        ↓
Emergency Session Created
        ↓
Real GPS Captured
        ↓
Emergency ID Generated
        ↓
Live Tracking Started
        ↓
Guardian Notified
        ↓
Emergency Contacts Notified
        ↓
Nearby Services Identified
        ↓
Guardian Dashboard Updated
        ↓
Emergency Resolved
        ↓
Tracking Stopped
        ↓
Emergency Saved to History
📱 Responsive Design

RESQORA is designed for:

📱 Mobile
📱 Tablet
💻 Laptop
🖥️ Desktop

The interface adapts navigation and layouts depending on screen size.

Mobile

Bottom navigation provides quick access to:

Home
Nearby
SOS
RESQ AI
Profile
Desktop

A sidebar provides access to major features while making better use of larger screens.

🚀 Getting Started
1. Clone the repository
git clone https://github.com/Sreeshwan07/resqora.git
cd resqora
2. Install dependencies
npm install
3. Configure environment variables

Create:

.env

Add the required configuration for the services enabled in your deployment, such as:

VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

VITE_EMAILJS_PUBLIC_KEY=
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=

VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=

Only configure variables actually required by the current application.

4. Run locally
npm run dev

Open the local URL shown by Vite.

5. Production build
npm run build

Preview the production build:

npm run preview
🔑 Required Permissions

Depending on the features used, RESQORA may request:

📍 Location
🎙️ Microphone
📷 Camera
🔔 Notifications

Permissions are requested only when required by the corresponding feature.

🌐 Deployment

RESQORA can be deployed using platforms such as:

Vercel
Netlify
Other modern web hosting platforms

For production deployment, configure all required environment variables in the hosting platform.

Ensure the application uses HTTPS, especially for:

Geolocation
Camera
Microphone
Notifications
PWA functionality
⚠️ Emergency Disclaimer

RESQORA is designed to assist users during emergencies, but it does not replace professional emergency services, doctors, hospitals, police, fire services, or ambulance services.

In a life-threatening emergency, users should contact the appropriate local emergency service immediately.

AI-generated information should be treated as assistance rather than a medical diagnosis.

🎯 Vision

RESQORA aims to transform emergency response from a simple "call for help" system into a connected emergency-response ecosystem.

From:

Emergency → Call for Help

To:

Emergency → Detect → Assess → Locate → Notify → Coordinate → Respond

🔮 Future Scope

Potential future improvements include:

Advanced AI emergency severity detection
Automated emergency dispatch integrations
Wearable device integration
Vehicle crash detection
Hospital availability integration
Emergency responder applications
Advanced predictive emergency analytics
Multi-user emergency coordination
Smart ambulance routing
