# Siran — Smart Crowd Flow for Sporting Events

**சிரணை (Siranai)** — *To Organize*

A large-scale sporting event intelligence platform connecting Participants, Organizers, Sponsors, and Venue Owners. Built for the 2024 GDG Hackathon.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Next.js 16 (App Router)           │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Auth Pages│  │Dashboard │  │  API Integration │  │
│  │ login     │  │ organizer│  │  ergast.ts       │  │
│  │ register  │  │ particip.│  │  thesportsdb.ts  │  │
│  │           │  │ venue-own│  │  wikidata.ts     │  │
│  └──────────┘  │ sponsor  │  │  venues.ts       │  │
│                └──────────┘  └──────────────────┘  │
├─────────────────────────────────────────────────────┤
│                    Firebase                         │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐    │
│  │   Auth   │  │ Firestore│  │   Storage      │    │
│  │  4 roles │  │ real-time│  │ venue maps     │    │
│  └──────────┘  └──────────┘  └────────────────┘    │
└─────────────────────────────────────────────────────┘
```

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack) |
| UI | Tailwind CSS 4 + shadcn/ui (base-ui) |
| Auth | Firebase Authentication (Email/Password) |
| Database | Firestore (real-time via `onSnapshot`) |
| Storage | Firebase Storage |
| Maps | Leaflet.js + OpenStreetMap |
| State | React Context (auth) + local state |
| External APIs | Ergast F1, TheSportsDB, Wikidata SPARQL |

---

## Features

### Crowd Flow Intelligence (Hero Feature)
- Participants declare arrival time window during registration
- Gate assignment algorithm routes each participant to the least-loaded gate
- Live congestion status: 🟢 Low / 🟡 Medium / 🔴 High
- Organizer dashboard with per-gate load controls and arrival projection histogram
- Venue map overlay with color-coded gate pins

### Multi-Role Platform
| Role | Capabilities |
|---|---|
| **Participant** | Browse events, register with arrival declaration, view gate assignment, live congestion, organizer instructions |
| **Organizer** | Create events, crowd arrival dashboard, broadcast instructions, manage gate loads, view sponsor requests |
| **Venue Owner** | List venues with sport-specific schema, configure gates, upload venue maps, enrich from external APIs |
| **Sponsor** | Browse events by sport/city, send inquiries to organizers, track response status |

### Instruction Broadcasting
- Organizers broadcast instructions (gate_change, crowd_alert, general, reminder)
- Priority levels: info, warning, urgent
- Participants see instructions in real-time on event pages
- Urgent alerts highlighted with visual banners

### Venue Data Enrichment (API Integration)
- Search 3 external databases to auto-fill venue details
- **Ergast API**: 80 F1 circuits worldwide (free, no key)
- **TheSportsDB**: Cricket, football, tennis venues (free tier)
- **Wikidata**: Indian stadiums with capacity, sport, city (SPARQL)

---

## Pages & Routes

```
/                           Landing page with role cards
/login                      Sign in
/register                   Sign up with role selection

(participant)
/participant/browse         Discover events, filter by sport/city
/participant/event/[id]     Event detail, registration, gate pass, instructions
/participant/my-events      Registered events with gate info

(organizer)
/organizer/dashboard        Stats, event list with live gate loads
/organizer/events/create    Create event with venue+sport selection
/organizer/events/[id]      Crowd dashboard, gate controls, broadcast instructions
/organizer/sponsor-requests Accept/decline sponsor inquiries

(venue-owner)
/venue-owner/venues         Listed venues grid
/venue-owner/venues/create  Add venue with gate config + API lookup
/venue-owner/venues/[id]    Venue details + enrich from APIs

(sponsor)
/sponsor/browse             Browse sponsorship opportunities
/sponsor/my-inquiries       Track inquiry statuses

/seed                       Seed demo data (4 venues, 4 events, registrations)
```

---

## Firestore Data Model

```
/users/{uid}
  role: "participant" | "organizer" | "venue_owner" | "sponsor"
  displayName, email, createdAt

/venues/{venueId}
  ownerId, name, sportTypes[], capacity, city, address, lat, lng
  gates: [{ id, label, x, y, zone }]
  mapImageUrl, surface, description, status

/events/{eventId}
  organizerId, venueId, venueName, venueCity
  title, sportCategory, date, time, capacity, registeredCount
  arrivalSlots: { "17:30": 45, "18:00": 32, ... }
  gateLoad: { gate-1: "medium", gate-2: "low", ... }
  status: "upcoming" | "live" | "completed"

/registrations/{regId}
  userId, eventId, arrivalWindow, assignedGate, createdAt

/sponsorships/{id}
  sponsorId, eventId, message, status: "pending" | "accepted" | "declined"

/instructions/{id}
  eventId, organizerId, title, message, priority, type, targetGateId
```

---

## Gate Assignment Algorithm

```typescript
// src/lib/crowd.ts
function assignGate({ arrivalWindow, gates, existingRegistrations, gateCapacity }) {
  // 1. Count existing registrations per gate for this arrival window
  // 2. Pick the gate with the lowest count
  // 3. Return gate ID

  // Congestion thresholds:
  //   < 30% capacity → 🟢 Low
  //   30-70% capacity → 🟡 Medium
  //   > 70% capacity → 🔴 High
}
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- Firebase project at [console.firebase.google.com](https://console.firebase.google.com)

### 1. Clone & Install
```bash
cd siran
npm install
```

### 2. Firebase Configuration
Create `.env.local` with your Firebase config:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Optional: TheSportsDB API key (free key "3" works for dev)
NEXT_PUBLIC_SPORTSDB_API_KEY=3
```

### 3. Enable Firebase Services
1. **Authentication** → Get started → Enable **Email/Password** sign-in
2. **Firestore Database** → Create database → Start in **test mode** (or set rules to `allow read, write: if true;`)

### 4. Run
```bash
npm run dev
```

### 5. Seed Demo Data
1. Open `http://localhost:3000/register`
2. Create an account as **Organizer**
3. Go to `http://localhost:3000/seed`
4. Click **"Seed All Demo Data"**

This creates:
- 4 venues (Wankhede, Eden Gardens, JLN Stadium, Sree Kanteerava)
- 4 events across cricket, football, aquatics
- 15-25 mock registrations per event with gate assignments
- 3 sponsor inquiries (1 accepted, 2 pending)
- 5 organizer broadcast instructions

---

## Testing the Full Flow

### Flow 1: Core Crowd Intelligence
1. Register as **Venue Owner** → Add a venue with gates
2. Register as **Organizer** → Create event → Broadcast instructions
3. Register as **Participant** → Browse → Register with arrival window → View gate pass + instructions + crowd timeline

### Flow 2: Sponsor ↔ Organizer
1. Register as **Sponsor** → Browse events → Send inquiry
2. Login as **Organizer** → Sponsor Requests → Accept/Decline
3. Login back as **Sponsor** → My Inquiries → See updated status

### Flow 3: Live Event View
1. In Firestore console, set an event's `status` field to `"live"`
2. Login as **Participant** → Open that event → See red "EVENT IS LIVE" banner + Gate Pass card

### Flow 4: API Venue Lookup
1. Login as **Venue Owner** → Create Venue
2. In the "Venue Data Lookup" card, search: `Wankhede`, `Monza`, `Silverstone`, `Eden Gardens`
3. Click "Apply Data" → form auto-fills name, city, capacity, sports, gates
4. On a venue detail page, click "Enrich Data" to backfill from APIs

---

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx              # NavBar + Firebase status
│   │   ├── organizer/
│   │   │   ├── dashboard/           # Stats + event list
│   │   │   ├── events/create/       # Event creation form
│   │   │   ├── events/[id]/         # Crowd dashboard + instructions
│   │   │   └── sponsor-requests/    # Sponsor inquiry inbox
│   │   ├── participant/
│   │   │   ├── browse/              # Event discovery
│   │   │   ├── event/[id]/          # Registration + gate pass
│   │   │   └── my-events/           # Registered events
│   │   ├── venue-owner/
│   │   │   ├── venues/              # Venue list
│   │   │   ├── venues/create/       # New venue + API lookup
│   │   │   └── venues/[id]/         # Venue detail + enrich
│   │   └── sponsor/
│   │       ├── browse/              # Browse sponsorship opps
│   │       └── my-inquiries/        # Inquiry status tracker
│   ├── login/                       # Sign in
│   ├── register/                    # Sign up with role picker
│   ├── seed/                        # Demo data populator
│   └── page.tsx                     # Landing page
├── components/
│   ├── shared/
│   │   ├── nav-bar.tsx              # Navigation + user menu
│   │   ├── role-guard.tsx           # Auth + role route protection
│   │   └── firebase-status.tsx      # Config health indicator
│   └── venue/
│       ├── venue-map.tsx            # Leaflet interactive map
│       ├── gate-pinner.tsx          # Gate listing component
│       └── venue-lookup.tsx         # API search + auto-fill
├── lib/
│   ├── firebase/
│   │   ├── config.ts                # Firebase initialization
│   │   ├── auth.ts                  # Sign up, login, logout, role
│   │   ├── firestore.ts             # CRUD helpers
│   │   ├── messaging.ts             # Sponsor ↔ Organizer messages
│   │   └── instructions.ts          # Broadcast instructions
│   ├── api/
│   │   ├── client.ts                # HTTP client with caching
│   │   ├── ergast.ts                # F1 circuit API (free)
│   │   ├── thesportsdb.ts           # Venue database API
│   │   ├── wikidata.ts              # SPARQL stadium queries
│   │   ├── venues.ts                # Unified enrichment service
│   │   └── types.ts                 # API type definitions
│   ├── auth-context.tsx             # React auth context provider
│   ├── crowd.ts                     # Gate assignment + congestion
│   ├── seed.ts                      # Demo data generator
│   ├── sports.ts                    # Sport category helpers
│   └── types.ts                     # Core TypeScript interfaces
```

---

## Branch Strategy

```
main                        Stable, production-ready code
feature/api-venue-integration  External API enrichment layer
```

---

## Key Design Decisions

- **City as free string**: City field accepts any value. 60+ cities are listed as suggestions in dropdown. API enrichment can use any city from external sources — if it matches our list, great; if not, the raw value is used.
- **No composite indexes needed**: All Firestore queries use single-field `where` clauses. Sorting is done client-side to avoid composite index requirements during hackathon.
- **Graceful API fallback**: All 3 API sources wrapped in try-catch. If one fails, others still return results. In-memory 30-min cache prevents rate limiting.
- **Real-time sync**: Organizer dashboard uses `onSnapshot` for live gate load updates. Participant page polls for instruction updates.
