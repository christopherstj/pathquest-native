# PathQuest Native App Design Specification

> **Note:** This document focuses on design principles, visual system, and future phases. For implementation details of completed features, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Table of Contents
1. [Design Principles](#design-principles)
2. [Visual Design System](#visual-design-system)
3. [Navigation Architecture](#navigation-architecture)
4. [Native Functionality](#native-functionality)
5. [Future Implementation Phases](#future-implementation-phases)

---

## Design Principles

### 1. Browse-First Experience
Users can explore peaks and challenges without logging in. Authentication is only required for personal features:
- Viewing your own summits/logs
- Adding trip reports
- Logging manual summits
- Favoriting peaks/challenges
- Accessing the Home and You tabs

### 2. Data-Centric Layouts
The map is a tool, not the canvas for everything. Use it where it adds value:
- **Explore tab**: Map is primary (spatial discovery)
- **Home tab**: No map (dashboard/stats focus)
- **You tab**: Map is optional toggle (list by default)
- **Peak/Challenge Detail**: Map is optional preview

### 3. Frictionless Logging
Every UI friction point in trip report logging costs 50% of submissions:
- Camera-first photo capture (one tap to camera)
- Tag chips for conditions (no typing)
- Optional notes field (collapsed by default)
- Offline queue (submit even without connectivity)

### 4. Native-Worthy Features
GPS, compass, and camera are core to the experience, not bolted on:
- **GPS**: Powers "nearby" sorting, distance/bearing, summit verification
- **Compass**: Full-screen navigation to peaks
- **Camera**: Primary method for adding photos to reports

### 5. User Location Always Visible
Whenever a map is displayed, the user's current location should always be shown:
- **Location puck**: Blue dot with accuracy ring and heading indicator
- **Visible on all map screens**: Explore, Peak/Challenge floating cards, You (map mode)
- **Permission handling**: If location permission denied, show map without puck but prompt to enable
- **Auto-center option**: "Center on me" button to quickly return to user location

---

## Visual Design System

### Aesthetic Direction: Retro Topographic

PathQuest's visual identity is inspired by **vintage USGS quad maps, 1970s Sierra Club publications, and hand-annotated hiking journals**. The aesthetic balances **authentic cartographic elements** with **modern mobile UX patterns**.

**Core Concept**: Field guide meets trail map — practical, beautiful, and unmistakably "peakbagging."

---

### Color Palette

#### Theme-Aware Colors (System Light/Dark)

The app **follows the system appearance setting** (light/dark) and provides distinct palettes for each:

**Dark Mode** (Field Guide at Night):
- **Background**: `#25221E` - Dark warm brown (NOT gray)
- **Card Surface**: `rgba(22, 17, 7, 0.92)` - Semi-transparent dark parchment
- **Foreground Text**: `#EDE5D8` - Warm off-white
- **Muted Text**: `#A9A196` - Warm gray
- **Primary (CTAs)**: `#5B9167` - Bright forest green
- **Secondary (Accents)**: `#B8845A` - Rust/amber
- **Summited Blue**: `#4A8BC4` - Sky blue (for summited indicators, trip reports)
- **Border**: `rgba(69, 65, 60, 0.7)` - Warm dark tones

**Light Mode** (Paper Map by Day):
- **Background**: `#EDE5D8` - Aged parchment
- **Card Surface**: `rgba(232, 225, 212, 0.92)` - Slightly darker parchment
- **Foreground Text**: `#3D3428` - Deep umber ink
- **Muted Text**: `#736B5E` - Muted brown
- **Primary (CTAs)**: `#4D7A57` - Forest green
- **Secondary (Accents)**: `#C9915A` - Rust/umber
- **Summited Blue**: `#5B9BD5` - Sky blue
- **Border**: `rgba(201, 194, 181, 0.7)` - Warm light tones

**Contour Ink** (Topo Pattern Color):
- **Dark Mode**: `rgba(169, 161, 150, 0.14)` - Tan contour ink at 14% opacity
- **Light Mode**: `rgba(169, 161, 150, 0.10)` - Tan contour ink at 10% opacity
- Always use **tan/brown tones** for topo lines (never blue or green) to maintain authentic map feel

**Usage**:
- Access colors via `useTheme()` hook: `const { colors } = useTheme()`
- Use `colors.primary`, `colors.foreground`, `colors.card`, etc.
- Never hardcode hex values — always use theme tokens

---

### Typography

**Display Font**: Fraunces (serif)
- Use for: Headings, titles, labels, body text
- Weights: Regular (400), Medium (500), SemiBold (600), Bold (700)
- Tailwind classes: `font-display`, `font-display-medium`, `font-display-semibold`, `font-display-bold`
- Component: `<Text>` (automatically applies Fraunces)

**Data Font**: IBM Plex Mono (monospace)
- Use for: Numbers, stats, elevations, dates, data values
- Weights: Regular (400), Medium (500), SemiBold (600)
- Tailwind classes: `font-mono`, `font-mono-medium`, `font-mono-semibold`
- Component: `<Value>` (automatically applies IBM Plex Mono)

**Guidelines**:
- **Default to `<Text>`** for most UI elements
- **Use `<Value>`** only for specific data displays (elevations, distances, stats)
- Never use system fonts or generic sans-serif — always use theme fonts

---

### Topographic Patterns

#### Contour Lines (`TopoPattern`)

**Purpose**: Add authentic map texture without overwhelming content.

**Implementation**:
- **Component**: `src/components/ui/TopoPattern.tsx`
- **Deterministic**: Always pass a `seed` prop (e.g., `seed="quickstats"`) so patterns don't change between renders
- **Variants**:
  - `full` - Wavy horizontal contour lines across entire area
  - `corner` - Curved lines in top-left corner (subtle, doesn't fight content)
  - `subtle` - Scattered short lines (very minimal)
- **Opacity**: 
  - Dark mode: `0.12-0.18` (more visible)
  - Light mode: `0.08-0.12` (subtle)
- **Stroke Width**: `1.5px` (thick enough to read, not hairline)
- **Color**: Always tan (`#A9A196`) — never blue/green

**Usage**:
```tsx
<TopoPattern 
  width={cardWidth} 
  height={cardHeight}
  lines={3}
  opacity={0.14}
  variant="corner"
  seed="card-unique-id"
/>
```

**When to Use**:
- **Card backgrounds**: Use `variant="corner"` for subtle texture
- **Screen backgrounds**: Use `variant="full"` or `variant="subtle"` behind entire dashboard
- **Hero cards**: Can use `variant="full"` with `showMarkers` for elevation dots
- **Never**: Over content areas with text (use corner/subtle variants)

#### Mountain Ridge Silhouettes (`MountainRidge`)

**Purpose**: Break card edges and add visual interest at bottom of cards.

**Implementation**:
- **Component**: `src/components/ui/MountainRidge.tsx`
- **Position**: Always at `bottom` of card (breaks rectangle silhouette)
- **Variants**:
  - `jagged` - Sharp, irregular peaks (most common)
  - `rolling` - Smooth hills (softer feel)
  - `sharp` - Angular peaks (geometric)
- **Layers**: `2-3` layers with increasing opacity for depth
- **Opacity**: `0.06-0.10` (subtle, doesn't dominate)
- **Height**: `30-50px` depending on card size

**Usage**:
```tsx
<MountainRidge 
  width={cardWidth} 
  height={40}
  opacity={0.08}
  variant="jagged"
  layers={2}
/>
```

**When to Use**:
- **Hero cards**: Suggested peak, trip report CTA
- **Large cards**: Dashboard sections, detail panels
- **Never**: Small cards (stats, list items) — too busy

---

### Card Components

#### CardFrame

**Purpose**: Reusable card wrapper with consistent styling, topo patterns, and ridge silhouettes.

**Component**: `src/components/ui/CardFrame.tsx`

**Props**:
- `variant`: `'default' | 'hero' | 'cta'` - Controls shadow/elevation
- `topo`: `'none' | 'corner' | 'full'` - Topo pattern variant
- `ridge`: `'none' | 'bottom'` - Mountain ridge at bottom
- `seed`: `string` - Unique seed for deterministic topo pattern
- `accentColor`: `string` - Color for accent elements (borders, highlights)

**Usage**:
```tsx
<CardFrame
  variant="hero"
  topo="corner"
  ridge="bottom"
  seed="suggested-peak"
  accentColor={colors.primary}
>
  {/* Card content */}
</CardFrame>
```

**Guidelines**:
- **Always use CardFrame** for cards (don't create custom card styling)
- **Default variant**: Use `variant="default"` for most cards
- **Hero variant**: Use for prominent cards (suggested peak, trip report CTA)
- **CTA variant**: Use for call-to-action cards (stronger shadow)
- **Topo**: Use `corner` for most cards, `full` only for hero cards
- **Ridge**: Use `bottom` for hero/CTA cards, `none` for small cards

---

### Button Components

#### PrimaryCTA

**Purpose**: Primary action buttons — the most clickable elements on the page.

**Component**: `src/components/ui/PrimaryCTA.tsx`

**Visual Characteristics**:
- **Background**: Primary green (or custom `backgroundColor` prop)
- **Bevel**: Subtle top highlight line (white, 15-20% opacity)
- **Shadow**: Strong shadow (`elevation: 8`, `shadowOpacity: 0.35`) — must be stronger than card shadows
- **Pressed State**: `translateY(1)` + reduced shadow + haptic feedback
- **Padding**: `12px vertical, 16px horizontal`
- **Border Radius**: `10px`
- **Min Height**: `44px` (touch target)

**Props**:
- `label`: `string` - Button text
- `onPress`: `() => void` - Press handler
- `Icon?`: `LucideIcon` - Optional icon (16px)
- `disabled?`: `boolean`
- `backgroundColor?`: `string` - Custom background (e.g., summited blue)
- `foregroundColor?`: `string` - Custom text color (e.g., white on blue)

**Usage**:
```tsx
<PrimaryCTA
  label="View Details"
  onPress={handlePress}
  Icon={Mountain}
/>

// Custom color (e.g., blue for trip reports)
<PrimaryCTA
  label="Add Trip Report"
  onPress={handlePress}
  backgroundColor={colors.summited}
  foregroundColor={colors.summitedForeground}
/>
```

**Guidelines**:
- **Use for**: Primary actions (View Details, Add Report, Submit)
- **Visual Hierarchy**: PrimaryCTAs should be the most elevated elements (strongest shadows)
- **Custom Colors**: Use `backgroundColor` prop for accent colors (blue, rust) while maintaining button affordance
- **Never**: Use for secondary actions (use `SecondaryCTA` instead)

#### SecondaryCTA

**Purpose**: Secondary actions — still clearly tappable but less prominent.

**Component**: `src/components/ui/SecondaryCTA.tsx`

**Visual Characteristics**:
- **Background**: Transparent (shows muted background on press)
- **Border**: `1px` border using `colors.border`
- **Shadow**: Moderate shadow (`elevation: 4`)
- **Pressed State**: Shows muted background + reduced shadow
- **Padding**: `12px vertical, 16px horizontal`
- **Border Radius**: `10px`

**Props**:
- `label`: `string`
- `onPress`: `() => void`
- `Icon?`: `LucideIcon`
- `disabled?`: `boolean`

**Usage**:
```tsx
<SecondaryCTA
  label="Navigate"
  onPress={handleNavigate}
  Icon={Navigation}
/>
```

**Guidelines**:
- **Use for**: Secondary actions (Navigate, Cancel, View All)
- **Visual Hierarchy**: Less prominent than PrimaryCTA but still clearly tappable
- **Never**: Use for destructive actions (create separate `DestructiveCTA` if needed)

---

### Visual Hierarchy

#### Clickability Ranking (Most to Least)

1. **PrimaryCTA** - Strongest shadow, bevel, most prominent
2. **CardFrame (CTA variant)** - Strong shadow, topo texture
3. **CardFrame (Hero variant)** - Moderate shadow, topo + ridge
4. **CardFrame (Default)** - Subtle shadow, optional topo
5. **SecondaryCTA** - Border + moderate shadow
6. **Text links** - No background, subtle underline

#### Shadow Guidelines

- **PrimaryCTA**: `elevation: 8`, `shadowOpacity: 0.35`, `shadowRadius: 14`
- **CardFrame (CTA)**: `elevation: 6`, `shadowOpacity: 0.25`
- **CardFrame (Hero)**: `elevation: 4`, `shadowOpacity: 0.15`
- **CardFrame (Default)**: `elevation: 2`, `shadowOpacity: 0.1`
- **SecondaryCTA**: `elevation: 4`, `shadowOpacity: 0.1`

**Rule**: CTAs must have stronger shadows than cards to feel "clickable."

---

### Layout Patterns

#### Dashboard Cards

**Order** (top to bottom):
1. Quick Stats (3-column grid)
2. Trip Report CTA (if unreported summit exists) — **Main focus**
3. Suggested Peak Card (hero)
4. Favorite Challenges (list)

**Spacing**: `16px` gap between cards (`gap-4`)

#### Card Content Structure

```
┌─────────────────────────────┐
│  [Topo Pattern (corner)]    │  ← Subtle texture
│                              │
│  [Header Label]              │  ← Optional, with icon
│  ─────────────────────────   │  ← No horizontal rules
│                              │
│  [Main Content]              │  ← Peak name, stats, etc.
│                              │
│  [Action Buttons]            │  ← PrimaryCTA + SecondaryCTA
│                              │
│  [Mountain Ridge (bottom)]   │  ← Breaks edge
└─────────────────────────────┘
```

**Guidelines**:
- **No horizontal rules/dividers** — conflicts with topo aesthetic
- **Use spacing** (`gap`, `mb-3`, etc.) to separate sections
- **Topo patterns** in corners/background, not over content
- **Ridge silhouettes** only at bottom of hero cards

---

### Component Usage Checklist

When building a new card/component, ensure:

- [ ] Uses `CardFrame` wrapper (not custom card styling)
- [ ] Uses theme colors via `useTheme()` hook
- [ ] Uses `<Text>` component (not raw RN Text)
- [ ] Uses `<Value>` for numbers/stats
- [ ] Topo pattern has unique `seed` prop
- [ ] Topo opacity appropriate for light/dark mode
- [ ] No horizontal rules/dividers (use spacing instead)
- [ ] PrimaryCTA for main actions (strongest shadow)
- [ ] SecondaryCTA for secondary actions
- [ ] Shadows follow hierarchy (CTA > Hero > Default)
- [ ] Ridge silhouette only on hero/CTA cards

---

### Accessibility

- **Touch Targets**: Minimum `44px` height for all buttons
- **Contrast**: Text meets WCAG AA (foreground on background)
- **Color Independence**: Don't rely solely on color (use icons + labels)
- **Font Scaling**: Respect system font size preferences
- **Dark Mode**: Always test in both light and dark modes

---

## Navigation Architecture

### Tab Structure

```
┌─────────────────────────────────────────────┐
│                                             │
│              [TAB CONTENT]                  │
│                                             │
├─────────────────────────────────────────────┤
│   🏠 Home   │   🗺️ Explore   │   👤 You     │
└─────────────────────────────────────────────┘
```

| Tab | Purpose | Has Map? | Auth Required? |
|-----|---------|----------|----------------|
| **Home** | Dashboard, quick actions, activity feed | No | Yes |
| **Explore** | Map + discovery + detail views | Yes (always) | No (browse), Yes (personal) |
| **You** | Stats, peaks, journal, challenges | Toggle (list/map) | Yes |

### Navigation Flow

- **Home tab**: Personal dashboard (no map)
- **Explore tab**: Map background with bottom sheet for discovery/detail views
- **You tab**: Profile with sub-tabs (Stats, Peaks, Journal, Challenges, Review)
- **Detail views**: Rendered inside Explore tab's bottom sheet (Peak Detail, Challenge Detail, Activity Detail, User Profile)
- **Deep links**: Support for direct navigation to peaks, challenges, users

**See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed navigation implementation.**

---

## Native Functionality

### GPS Location

**Expo Module:** `expo-location`

**Permission Flow:**
1. On first map view or "nearby" action
2. Show explanation: "PathQuest uses your location to find nearby peaks"
3. Request `Permissions.ACCESS_FINE_LOCATION`
4. Fallback: Show map without location puck, hide distance/bearing, show "Enable location" prompt

**Location Puck (Always Visible on Maps):**
- Blue dot with accuracy ring
- Heading indicator (arrow showing device orientation)
- Displayed on ALL map screens when permission granted
- "Center on me" FAB button to recenter map on user location

**Usage Points:**
- Map location puck (foreground only)
- Discovery list sorting by distance
- Peak Detail GPS strip (distance/bearing/vert)
- Compass View navigation
- Floating card distance display

### Camera

**Expo Module:** `expo-image-picker`

**Permission Flow:**
1. On first photo tap in Add Report or Manual Summit
2. Request camera permission
3. Fallback: Use photo library picker

**Behavior:**
- Primary: Open camera directly (camera-first UX)
- Fallback: Photo library picker
- Store captured photos locally until upload succeeds
- Extract EXIF for `taken_at` timestamp

### Compass/Magnetometer

**Expo Module:** `expo-sensors` (Magnetometer)

**Permission Flow:**
- Usually no permission required
- Check `Magnetometer.isAvailableAsync()`

**Behavior:**
- Calculate bearing to peak from user location
- Rotate arrow graphic based on device heading + bearing
- Fallback: Show static bearing number without rotating arrow

### Offline Cache

**Implementation:** TanStack Query with persistence (planned)

**Cached Data:**
- Recently viewed peaks (full detail)
- Recently viewed challenges (full detail)
- User's summit history
- User's challenge progress

**Not Cached (v1):**
- Map tiles (Mapbox handles this separately)
- Community reports (fetch on demand)
- Search results

---

## Future Implementation Phases

### ⏳ Phase 5: Polish + Offline (NEXT - Pre-Launch)

**Priority Order:**

1. **TanStack Query Persistence** (MEDIUM-HIGH PRIORITY)
   - Persist query cache to AsyncStorage
   - Restore cache on app launch
   - Reduces loading times for frequently accessed data
   - **Why important:** Faster app startup, better perceived performance

2. **Offline Queue for Reports** (MEDIUM PRIORITY)
   - Queue trip reports and manual summits when offline
   - Store form data + photos locally
   - Sync queue when connectivity restored
   - Show "pending upload" indicators
   - **Why important:** Mountain environments often lack connectivity

3. **Push Notification Setup** (MEDIUM PRIORITY)
   - Expo Push Notifications integration
   - Register device tokens with backend
   - Notification preferences in Settings
   - Basic notifications (challenge progress, new reports)
   - **Why important:** Re-engagement driver

---

### Phase 6: Auth & Data Integrations

#### Phase 6.1: Additional OAuth Providers

**Google OAuth:**
- Google Sign-In integration via `@react-native-google-signin/google-signin`
- OAuth 2.0 flow with Google Cloud Console setup
- Profile picture and basic info sync
- Account linking (allow users to link Google to existing Strava account)

**Apple Sign-In:**
- Apple Authentication Services integration via `expo-apple-authentication`
- Native iOS implementation (required for App Store)
- Privacy-focused (minimal data sharing, relay email)
- Account linking support

**Provider Management:**
- Settings page: Show connected auth providers
- Ability to link/unlink providers
- Primary login method designation

#### Phase 6.2: Email Signup & Passwordless Auth

**Email Signup Flow:**
- Email address collection
- Verification via magic link or code
- Passwordless authentication (no password required)

**Magic Link Authentication:**
- Send email with secure, time-limited link
- Link opens app via deep linking (Expo Linking)
- Web fallback for email clients that block deep links
- Link expiration: 15 minutes
- One-time use (invalidate after use)

**Email Code Authentication:**
- Send 6-digit code to email
- Code entry screen in app
- Code expiration: 10 minutes
- Rate limiting: Max 3 requests per 10 minutes

#### Phase 6.3: Fitness Device Integrations

**Supported Devices:**
- **Garmin Connect**: OAuth integration, activity sync, GPS track processing
- **COROS**: OAuth integration, activity sync, elevation and performance metrics

**Activity Import & Processing:**
- **Initial Backfill:** Import ALL available historical activities on first connect
- **Ongoing Sync:** New activities synced automatically or on manual trigger
- **GPS Track Processing:** Fetch GPX/TCX data, pass through existing summit detection system
- **Manual Review:** Show detected summits to user for confirmation

**Settings & Management:**
- Connected Devices Screen: List connected devices with last sync time
- Connect/disconnect device accounts
- Manual sync button per device
- Sync progress indicator

---

### Phase 7: Premium Features

Premium subscription tier ($4/month) providing proactive weather alerts, enhanced map overlays, offline maps, extended forecasts, and trailhead navigation.

**Free Tier:** Everything built in Phases 1-6 (all current features).

**Premium Tier:** Weather alerts, map overlays, offline maps, 14-day forecasts, trailhead navigation.

#### Phase 7.1: Premium Subscription System

**Pricing:**
- **$4/month** (single tier)
- Optional free trial (7 days, TBD)
- Annual option: $36/year (25% discount)

**Subscription Infrastructure:**
- Stripe Checkout for payment processing
- Stripe Customer Portal for subscription management
- Webhook handling for subscription lifecycle events
- Handle subscription lapse gracefully (features disabled, data retained)

**What Happens on Lapse:**
- Premium features disabled immediately
- All user data retained (summits, favorites, etc.)
- Offline maps remain downloaded but can't download new ones
- Clear messaging: "Your premium subscription has ended. Upgrade to restore features."

#### Phase 7.2: Proactive Weather Alerts

**Alert System:**
- **Alert Source:** Official weather service alerts only (no custom thresholds)
  - NWS (National Weather Service) alerts for US locations
  - Open-Meteo weather alerts for international
- **What Triggers Alerts:** Active weather advisories/warnings for favorited peak locations
- **Uses existing favorites system** - Alerts only sent for favorited peaks/lands

**Backend Implementation:**
- Background job runs hourly
- For each premium user with favorited peaks:
  1. Get all favorited peaks/lands with coordinates
  2. Check NWS/Open-Meteo for active alerts at those coordinates
  3. Generate app alerts for any active weather alerts
  4. Queue for delivery (push, email, in-app)
- **Deduplication:** Don't re-alert same weather event for 24 hours
- **Batching:** Group multiple alerts in same region into single notification

**Push Notification Infrastructure:**
- Use `expo-notifications` package
- Register for push token on app startup (after permission granted)
- Store push tokens in database
- Use Expo Push API for sending notifications
- Deep linking: Tap notification → open peak/land detail page

#### Phase 7.3: Map Overlays

**Weather Overlay:**
- Data Source: Open-Meteo API (works globally)
- Gridded weather data for current conditions
- Render as semi-transparent colored overlay (temperature heat map, precipitation gradient)
- Update overlay as map moves/zooms (debounced)
- UI: Overlay toggle button, legend panel, time selector

**Snow Pack Overlay:**
- Data Source: SNODAS (Snow Data Assimilation System) from NOAA for US, Open-Meteo for international
- Gridded data at 1km resolution
- Render as colored overlay (white → light blue → deep blue)
- UI: Overlay toggle, legend showing snow depth scale, date selector

**Park Alerts/Closures Overlay:**
- Data Sources: NPS API, USFS (research needed), BLM (research needed), State Parks (varies)
- Fetch alerts/closures for current map bounds
- Render as colored polygons/markers (red: closures, yellow: warnings, blue: information)
- UI: Overlay toggle, alert markers on map, alert detail popup

#### Phase 7.4: Offline Maps

**Implementation:**
- Map tile downloads using Mapbox Offline API
- Allow user to select region on map and zoom levels
- Download tiles to device storage
- Show download progress and storage used

**Storage Management:**
- Show total storage used by offline maps
- Delete individual regions
- Automatic cleanup of expired tiles

**Offline Mode:**
- Detect when offline
- Use downloaded tiles instead of network
- Show "Offline" indicator
- Peak/challenge data cached via TanStack Query persistence

#### Phase 7.5: Extended Forecasts & Trailhead Navigation

**Extended Forecasts (14-day):**
- Extend current 7-day forecast to 14 days
- Use Open-Meteo extended forecast endpoint
- Show in peak detail view (premium badge on days 8-14)

**Trailhead/Road-to-Peak Navigation:**
- Data Source: Need to research (OpenStreetMap trails? Hiking Project API? AllTrails?)
- Show nearest trailhead to peak
- Driving directions to trailhead (link to Google Maps/Apple Maps)
- Trail route from trailhead to peak (if data available)
- Estimated hiking time/distance

---

### Phase 8: Route Planning & Multi-Peak Routes

**Overview:**
Full-featured route planning system that generates routes from trailheads to peaks using Valhalla routing engine, with support for multi-peak adventures. Routes intelligently handle off-trail segments to summits.

**Key Features:**

**1. Single Peak Route Planning**
- Find trailheads near peak (OSM data)
- Route from trailhead to nearest trail point to peak (Valhalla)
- Calculate off-trail segment from trail endpoint to summit
- Show complete route with elevation profile, distance, time estimates
- Drive directions to trailhead (Google Maps/Apple Maps deep links)

**2. Off-Trail Segment Handling**
- Routes to nearest trail point (not directly to summit)
- Calculates straight-line distance + bearing to summit
- Estimates actual walking distance (terrain multiplier)
- Time estimation using modified Naismith's rule

**3. Multi-Peak Route Extension**
- "Add Another Peak" button on route view
- Finds nearby peaks within 5 miles
- Chains routes: trailhead → peak1 → peak2 → peak3
- Optimizes peak ordering (nearest-neighbor algorithm)
- Supports loops, out-and-back, and point-to-point routes

**4. Route Saving & Management**
- Save suggested routes to user account
- Saved routes appear in user profile
- Routes can be shared (if user makes them public)
- View saved routes on map

**5. Pre-computed Routes**
- Background job pre-computes routes for challenge peaks
- Instant results for popular challenge peaks
- Weekly updates as OSM data changes

**6. Route from Current Location**
- Route from user's GPS location to peak (requires network)
- Two modes:
  - **"Navigate to Peak"**: Full route from current location to nearest trail point
  - **"Find Trail"**: Quick route to nearest point on any trail (useful when off-trail)

**7. Offline Route Navigation**
- Download routes for offline use
- Fully offline capabilities:
  - Display downloaded route on map (using cached tiles)
  - Show current GPS location (device capability, no network needed)
  - Snap current location to route (pure math, works offline)
  - Calculate remaining distance to peak(s) (pure math, works offline)
  - Calculate remaining elevation to peak(s) (pure math, works offline)
  - Display bearing/direction to route if off-route
- **No activity tracking**: Just location display + distance/elevation calculations
- Storage management: View downloaded routes, delete individual routes, see total storage used

**Technical Architecture:**

**Routing Service:**
- Valhalla (containerized, Cloud Run)
- 8GB RAM, 2 CPU, min instances = 1
- Pre-built Valhalla tiles baked into container (~8GB)
- Weekly tile rebuild pipeline (OSM updates)

**Data Flow:**
```
User requests route → pathquest-api
  ↓
Find trailheads (OSM Overpass)
  ↓
Valhalla /locate (find nearest trail point to peak)
  ↓
Valhalla /route (trailhead → trail point)
  ↓
Calculate off-trail segment (distance, bearing, time)
  ↓
Return complete route with segments
```

**Effort Estimate:**
- Valhalla setup + tile building: 1 week
- Single-peak routes: 1 week
- Multi-peak extension: 1 week
- Route saving + API: 1 week
- Route from current location: 0.5 weeks
- Offline download + storage: 1 week
- Offline navigation UI: 1.5 weeks
- UI (native + web): 2 weeks
- Pre-computation job: 0.5 weeks
- **Total: 8-9 weeks**

---

## Implementation Status

**Completed Phases:**
- ✅ Phase 1: Core Navigation + Explore
- ✅ Phase 2: Peak Detail + GPS
- ✅ Phase 2.5: Compass View
- ✅ Phase 2.9: Challenge Detail + Show on Map
- ✅ Phase 3: You Tab Enhancement
- ✅ Phase 3.9: Photo Infrastructure
- ✅ Phase 4: Actions + Modals
- ✅ Phase 4.5: Summit Review
- ✅ Phase 4.6: Unauthenticated Experience
- ✅ Phase 5.1: Onboarding Flow (multi-step modal with AsyncStorage persistence)

**Next Up:**
- ⏳ Phase 5: Polish + Offline (query persistence, offline queue, push notifications)

**Future:**
- Phase 6: Auth & Data Integrations
- Phase 7: Premium Features
- Phase 8: Route Planning & Multi-Peak Routes

For detailed implementation documentation of completed features, see [ARCHITECTURE.md](./ARCHITECTURE.md).
