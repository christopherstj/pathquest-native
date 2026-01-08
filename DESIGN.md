# PathQuest Native App Design Specification

## Table of Contents
1. [Design Principles](#design-principles)
2. [Visual Design System](#visual-design-system)
3. [Navigation Architecture](#navigation-architecture)
4. [Screen Wireframes](#screen-wireframes)
5. [Native Functionality](#native-functionality)
6. [Component Architecture](#component-architecture)
7. [State Management](#state-management)
8. [API Requirements](#api-requirements)

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

### Implementation Notes

**Theme System**:
- Theme follows system appearance (light/dark)
- Access via `useTheme()` hook: `const { colors, isDark } = useTheme()`
- Colors defined in `src/theme/colors.ts`
- Navigation theme matches app theme automatically

**SVG Components**:
- `TopoPattern` and `MountainRidge` use `react-native-svg` (already installed)
- Always pass deterministic `seed` prop
- Patterns are subtle — if they're too visible, reduce opacity

**Button Components**:
- Use explicit background View (Pressable backgroundColor can be unreliable)
- Padding on content View, not Pressable
- Bevel highlight adds "physical button" feel

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

### Navigation Flow Diagram

```
                              ┌─────────────┐
                              │   App Root  │
                              └──────┬──────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           │                         │                         │
           ▼                         ▼                         ▼
    ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
    │    Home     │           │   Explore   │           │     You     │
    │  (Auth Req) │           │  (Public)   │           │  (Auth Req) │
    └──────┬──────┘           └──────┬──────┘           └──────┬──────┘
           │                         │                         │
           ▼                         │                         │
    ┌─────────────┐                  │                  ┌──────┴──────┐
    │  Dashboard  │                  │                  │             │
    └──────┬──────┘                  │                  ▼             ▼
           │                         │           ┌───────────┐ ┌───────────┐
           │                         │           │ List Mode │ │ Map Mode  │
           ▼                         │           └─────┬─────┘ └───────────┘
    ┌─────────────┐                  │                 │
    │ Add Report  │◄─────────────────┤                 │
    │   Modal     │                  │                 ▼
    └─────────────┘                  │           ┌───────────┐
                                     │           │  Manual   │
                                     │           │  Summit   │
                                     │           └───────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           │                         │                         │
           ▼                         ▼                         ▼
    ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
    │  Discovery  │           │ Peak Detail │           │  Challenge  │
    │    Mode     │           │   Screen    │           │   Detail    │
    └──────┬──────┘           └──────┬──────┘           └─────────────┘
           │                         │
           │                         ├──────────────────┐
           ▼                         ▼                  ▼
    ┌─────────────┐           ┌─────────────┐    ┌─────────────┐
    │  Floating   │           │   Compass   │    │ Add Report  │
    │    Card     │           │    View     │    │   Modal     │
    └─────────────┘           └─────────────┘    └─────────────┘
```

### Screen Inventory

| # | Screen | Map? | Auth? | Entry Points |
|---|--------|------|-------|--------------|
| 1 | Explore - Discovery | Yes | No | Default Explore state |
| 2 | Explore - Peak Floating Card | Yes | No | Tap peak marker or row |
| 3 | Explore - Challenge Floating Card | Yes | No | Tap challenge row |
| 4 | Peak Detail | Preview | Partial | Tap floating card "Details" |
| 5 | Challenge Detail | Preview | Partial | Tap floating card "Details" |
| 6 | Compass View | No | No | Tap bearing in Peak Detail |
| 7 | Add Report Modal | No | ✅ Yes | Hero card CTA, Peak Detail (✅ **IMPLEMENTED**) |
| 8 | Manual Summit Entry | No | Yes | You tab action |
| 9 | Home - Dashboard | No | Yes | Home tab |
| 10 | You - List Mode | No | Yes | You tab (default) |
| 11 | You - Map Mode | Yes | Yes | Toggle from list mode |
| 12 | Login Prompt | No | N/A | Any auth-gated action |
| 13 | Settings | No | ✅ Yes | You tab header (✅ **IMPLEMENTED**) |
| 14 | Onboarding | No | No | First launch only |
| 15 | Email Signup | No | No | Auth flow (Phase 6) |
| 16 | Email Verification | No | No | Email signup flow (Phase 6) |
| 17 | Account Linking | No | Yes | Settings (Phase 6) |
| 18 | Connected Devices | No | Yes | Settings (Phase 6) |
| 19 | Activity Import Review | No | Yes | Device sync (Phase 6) |
| 20 | Premium Upgrade | No | No | Premium features (Phase 7) |
| 21 | Alert Preferences | No | Yes (Premium) | Settings > Premium (Phase 7) |
| 22 | Alert List | No | Yes (Premium) | Bell icon in header (Phase 7) |
| 23 | Subscription Management | No | Yes (Premium) | Settings > Premium (Phase 7) |

### Navigation Implementation

**Expo Router (File-Based Routing):**
- ✅ Using Expo Router with Next.js-style file hierarchy
- ✅ Routes structure:
  ```
  app/
    (tabs)/
      _layout.tsx          # Tab bar navigation
      index.tsx            # Home tab
      profile.tsx         # You tab
      explore/
        _layout.tsx        # Explore layout (map + ContentSheet)
        index.tsx          # Discovery content
        peak/[peakId].tsx  # Peak detail route
        challenge/[challengeId].tsx  # Challenge detail route
  ```
- ✅ Native navigation stack with swipe-back gesture support
- ✅ State persistence: Discovery tab state (active tab, filters) persists across navigation
- ✅ Back navigation: Native back button and swipe gesture navigate through history
- ✅ Dismiss navigation: X button on detail pages returns directly to discovery view

**ContentSheet Integration:**
- Bottom sheet renders `<Slot />` from Expo Router
- Detail pages render inside the sheet
- Sheet snap points: collapsed (map only), halfway (discovery), expanded (detail)
- Sheet state managed by `sheetStore` (Zustand)

---

## Screen Wireframes

### 1. Explore - Discovery Mode

Default state of the Explore tab. Map fills the screen with a bottom sheet for nearby peaks/challenges.

```
┌─────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────┐ │
│ │              SEARCH BAR                 │ │
│ │  🔍 Search peaks or challenges...       │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│                                             │
│                                             │
│                    MAP                      │
│                                             │
│            📍 (user location)               │
│                                             │
│        ▲     ▲        ▲                     │
│              ▲    ▲                         │
│                  ▲                          │
│                                             │
│                                             │
├─────────────────────────────────────────────┤
│ ─────────────── (drag handle) ───────────── │
├─────────────────────────────────────────────┤
│  📍 12 peaks nearby · 3 in your challenges  │
├─────────────────────────────────────────────┤
│  [Peaks]  [Challenges]                      │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ ▲ Mt. Bierstadt                         │ │
│ │   14,065 ft · Class 2 · 2.3 mi away     │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ ▲ Mt. Evans                             │ │
│ │   14,265 ft · Class 2 · 4.1 mi away     │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ ▲ Grays Peak                            │ │
│ │   14,270 ft · Class 1 · 6.8 mi away     │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│   🏠 Home   │   🗺️ Explore   │   👤 You     │
└─────────────────────────────────────────────┘
```

**Sheet Snap Points:**
- Collapsed (~80px): Summary bar only
- Half (~45%): List visible, map interactive
- Expanded (~90%): Full list, map minimized

**Map Behavior:**
- **User location puck**: Always visible (blue dot with heading indicator)
- **"Center on me" FAB**: Floating button to recenter map on user location
- Peaks sorted by distance from user (GPS required)
- Without GPS: sorted by elevation or alphabetically, location puck hidden

**Interaction:**
- Segment control to switch between Peaks/Challenges
- Tap row → floating card appears
- Tap marker → floating card appears

---

### 2. Explore - Peak Floating Card

When a peak is selected (from list or marker tap), show a floating card over the map.

```
┌─────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────┐ │
│ │              SEARCH BAR                 │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│                                             │
│                                             │
│                    MAP                      │
│                                             │
│            📍─────────────▲                 │
│            (line to peak)                   │
│                                             │
│                                             │
│                                             │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │  ▲ MT. BIERSTADT                    ✕   │ │
│ │    14,065 ft · Class 2 · Front Range    │ │
│ ├─────────────────────────────────────────┤ │
│ │  ┌───────┐  ┌───────┐  ┌───────┐        │ │
│ │  │ 2.3mi │  │ 247°  │  │+1,800'│        │ │
│ │  │ away  │  │  WSW  │  │vert   │        │ │
│ │  └───────┘  └───────┘  └───────┘        │ │
│ ├─────────────────────────────────────────┤ │
│ │  3 reports this week · Last: "Icy"      │ │
│ ├─────────────────────────────────────────┤ │
│ │  [ Details ]  [ Compass ]  [ Navigate ] │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│   🏠 Home   │   🗺️ Explore   │   👤 You     │
└─────────────────────────────────────────────┘
```

**GPS Strip:**
- Distance (miles/km based on settings)
- Bearing (degrees + cardinal direction)
- Remaining vert (peak elevation - user elevation)

**Actions:**
- **Details**: Navigate to Peak Detail screen
- **Compass**: Open full-screen compass view
- **Navigate**: Open in Apple Maps / Google Maps
- **✕ or swipe down**: Dismiss card

**Behavior:**
- Draws line from user location to peak on map
- Card animates in from bottom
- GPS strip updates in real-time

---

### 3. Explore - Challenge Floating Card

Similar to peak card, but for challenges with progress indicator.

```
┌─────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────┐ │
│ │              SEARCH BAR                 │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│                                             │
│                    MAP                      │
│                                             │
│        ▲ (summited)                         │
│              ○ (not summited)               │
│                  ○    ▲                     │
│            ○              ▲                 │
│                                             │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │  🏔️ COLORADO 14ERS                  ✕   │ │
│ │     58 peaks · 6 summited                │ │
│ ├─────────────────────────────────────────┤ │
│ │  ████████░░░░░░░░░░░░░░  10% complete   │ │
│ ├─────────────────────────────────────────┤ │
│ │  Nearest unsummited: Mt. Bierstadt      │ │
│ │  2.3 mi away · 14,065 ft                │ │
│ ├─────────────────────────────────────────┤ │
│ │       [ Details ]      [ Navigate ]     │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│   🏠 Home   │   🗺️ Explore   │   👤 You     │
└─────────────────────────────────────────────┘
```

**Map Behavior:**
- Shows all peaks in challenge
- Summited peaks: filled marker (sky blue)
- Unsummited peaks: outline marker (green)
- If logged in: shows user's progress
- If not logged in: all peaks shown as neutral

**Actions:**
- **Details**: Navigate to Challenge Detail screen
- **Navigate**: Open nearest unsummited peak in maps

---

### 4. Peak Detail Screen

Full-screen detail view with collapsible hero and sub-tabs.

```
EXPANDED HEADER (scroll at top)
┌─────────────────────────────────────────────┐
│  ← Back                        ☆ Favorite   │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │                                         │ │
│ │           ▲ MT. BIERSTADT               │ │
│ │           14,065 ft · Class 2           │ │
│ │           Front Range, Colorado         │ │
│ │                                         │ │
│ │   ┌───────┐  ┌───────┐  ┌───────┐       │ │
│ │   │ 2.3mi │  │ 247°  │  │+1,800'│       │ │
│ │   │ away  │  │  WSW  │  │ vert  │       │ │
│ │   └───────┘  └───────┘  └───────┘       │ │
│ │                                         │ │
│ │        [ Show on Map ]                  │ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│  [Conditions]  [Community]  [Your Logs]     │
├─────────────────────────────────────────────┤
│                                             │
│   (Tab content scrolls here)                │
│                                             │
│                                             │
│                                             │
│                                             │
│                                             │
├─────────────────────────────────────────────┤
│   🏠 Home   │   🗺️ Explore   │   👤 You     │
└─────────────────────────────────────────────┘


COLLAPSED HEADER (scrolled up)
┌─────────────────────────────────────────────┐
│  ← Mt. Bierstadt · 14,065'   2.3mi · 247°  │
├─────────────────────────────────────────────┤
│  [Conditions]  [Community]  [Your Logs]     │
├─────────────────────────────────────────────┤
│                                             │
│                                             │
│   (Full height for content scroll)          │
│                                             │
│                                             │
│                                             │
│                                             │
│                                             │
│                                             │
│                                             │
│                                             │
├─────────────────────────────────────────────┤
│   🏠 Home   │   🗺️ Explore   │   👤 You     │
└─────────────────────────────────────────────┘
```

**Hero Card Components:**
- Peak name (large, display font)
- Elevation + difficulty class
- Location (range, state)
- GPS strip (distance, bearing, vert remaining)
- "Show on Map" button (returns to Explore with floating card)

**Sub-tabs:**

#### Conditions Tab
```
┌─────────────────────────────────────────────┐
│  NOW: 42°F · Wind 12 mph NW · Clear         │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐    │
│  │  ████████░░  8 reports this month   │    │
│  └─────────────────────────────────────┘    │
├─────────────────────────────────────────────┤
│  Recent Conditions                          │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ 🧊 Icy · Spikes needed                  │ │
│ │ @hiker42 · Dec 27 · "Ice on final 500"  │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ ✓ Good · No gear needed                 │ │
│ │ @mountainmike · Dec 24 · "Dry trail"    │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ 💨 Windy · Exposed                      │ │
│ │ @alpinelisa · Dec 22 · "40mph gusts"    │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

#### Community Tab ✅ **PHOTOS GALLERY IMPLEMENTED**

**Implementation Status:** ✅ Photo Gallery Complete
- **Component:** `src/components/explore/PeakPhotosGallery.tsx`
- **Integration:** Used in `PeakDetailCommunityTab.tsx`
- **Features Implemented:**
  - ✅ 3-column photo grid layout
  - ✅ Fullscreen photo viewer modal
  - ✅ Swipe navigation between photos
  - ✅ Photo metadata display (photographer, date)
  - ✅ Empty state with call-to-action
  - ✅ Loading states
  - ✅ Uses `GET /api/peaks/:id/photos` endpoint

```
┌─────────────────────────────────────────────┐
│  42 people have summited this peak          │
├─────────────────────────────────────────────┤
│  [Recent]  [Top Rated]  [Photos]            │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ 📷 Photos (12)                           │ │
│ │ ┌─────┐┌─────┐┌─────┐                   │ │
│ │ │ 📷  ││ 📷  ││ 📷  │                   │ │
│ │ └─────┘└─────┘└─────┘                   │ │
│ │ ┌─────┐┌─────┐┌─────┐                   │ │
│ │ │ 📷  ││ 📷  ││ 📷  │                   │ │
│ │ └─────┘└─────┘└─────┘                   │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ @hiker42 · Dec 27, 2024                 │ │
│ │ ★★★★☆ · Hard · 🧊 Icy                   │ │
│ │ "Started at 5am, ice on final 500 ft.   │ │
│ │  Microspikes essential. Views were..."  │ │
│ │ ┌─────┐┌─────┐┌─────┐                   │ │
│ │ │ 📷  ││ 📷  ││ 📷  │                   │ │
│ │ └─────┘└─────┘└─────┘                   │ │
│ │ 👍 12 helpful                           │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ @mountainmike · Dec 24, 2024            │ │
│ │ ★★★★★ · Moderate · ✓ Good               │ │
│ │ "Perfect day! Trail was dry..."         │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

#### Your Logs Tab (Auth Required)
```
┌─────────────────────────────────────────────┐
│  You've summited this peak 2 times          │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ Dec 15, 2024 · via Strava               │ │
│ │ ★★★★☆ · Moderate                        │ │
│ │ "Great conditions, started early..."    │ │
│ │                          [ Edit ]       │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ Jul 4, 2023 · via Strava                │ │
│ │ (No report added)                       │ │
│ │                     [ Add Report ]      │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│                                             │
│       [ Log Manual Summit ]                 │
│                                             │
└─────────────────────────────────────────────┘
```

---

### 5. Challenge Detail Screen

```
EXPANDED HEADER
┌─────────────────────────────────────────────┐
│  ← Back                        ☆ Favorite   │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │                                         │ │
│ │        🏔️ COLORADO 14ERS                │ │
│ │        58 peaks above 14,000 ft         │ │
│ │        Colorado, USA                    │ │
│ │                                         │ │
│ │  ████████████░░░░░░░░░░░░  6/58 (10%)   │ │
│ │                                         │ │
│ │        [ Show on Map ]                  │ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│  [Progress]  [All Peaks]                    │
├─────────────────────────────────────────────┤
│                                             │
│   (Tab content scrolls here)                │
│                                             │
├─────────────────────────────────────────────┤
│   🏠 Home   │   🗺️ Explore   │   👤 You     │
└─────────────────────────────────────────────┘
```

#### Progress Tab (Auth Required)
```
┌─────────────────────────────────────────────┐
│  Your Progress                              │
├─────────────────────────────────────────────┤
│  6 summited · 52 remaining                  │
│  Next closest: Mt. Bierstadt (2.3 mi)       │
├─────────────────────────────────────────────┤
│  Recent Summits                             │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ ✓ Grays Peak · Dec 15, 2024             │ │
│ │ ✓ Torreys Peak · Dec 15, 2024           │ │
│ │ ✓ Mt. Evans · Aug 3, 2024               │ │
│ │ ✓ Mt. Bierstadt · Jul 20, 2024          │ │
│ │ ✓ Quandary Peak · Jun 1, 2024           │ │
│ │ ✓ Mt. Elbert · May 15, 2024             │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│  Milestones                                 │
├─────────────────────────────────────────────┤
│  ○ 10 peaks (4 to go!)                      │
│  ○ 25 peaks                                 │
│  ○ 50 peaks                                 │
│  ○ All 58 peaks                             │
└─────────────────────────────────────────────┘
```

#### All Peaks Tab
```
┌─────────────────────────────────────────────┐
│  [By Distance]  [By Elevation]  [A-Z]       │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ ✓ Mt. Elbert · 14,440 ft · Summited     │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ ✓ Mt. Massive · 14,428 ft · Summited    │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ ○ Mt. Harvard · 14,421 ft               │ │
│ │   12.4 mi away                          │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ ○ Blanca Peak · 14,351 ft               │ │
│ │   45.2 mi away                          │ │
│ └─────────────────────────────────────────┘ │
│              ... more peaks ...             │
└─────────────────────────────────────────────┘
```

---

### 6. Compass View

Full-screen compass pointing toward the selected peak.

```
┌─────────────────────────────────────────────┐
│  ← Back                    MT. BIERSTADT    │
├─────────────────────────────────────────────┤
│                                             │
│                                             │
│                     N                       │
│                     │                       │
│                     │                       │
│                     │                       │
│            W ───────┼─────── E              │
│                     │                       │
│                     │                       │
│                     │                       │
│                     S                       │
│                                             │
│                                             │
│                    ▲▲▲                      │
│                   ▲▲▲▲▲                     │
│                    ▲▲▲                      │
│              (arrow to peak)                │
│          (rotates with device)              │
│                                             │
│                                             │
├─────────────────────────────────────────────┤
│         2.3 mi · 247° WSW · +1,800 ft       │
├─────────────────────────────────────────────┤
│             [ Open in Maps ]                │
└─────────────────────────────────────────────┘
```

**Behavior:**
- Uses device magnetometer (compass)
- Arrow rotates to always point toward peak
- GPS strip shows live distance/bearing/vert
- Works offline once peak location is cached

---

### 7. Add Report Modal ✅ **IMPLEMENTED**

Camera-first, minimal-friction trip report entry.

**Implementation Status:** ✅ Complete
- **Component:** `src/components/modals/AddReportModal.tsx`
- **Store:** `src/store/addReportStore.ts` (Zustand state management)
- **Integration:** Global modal rendered in `app/_layout.tsx`
- **Features Implemented:**
  - ✅ Camera-first photo capture with `expo-image-picker`
  - ✅ Photo upload with progress tracking (GCS signed URLs)
  - ✅ Condition tags (multi-select with emoji chips)
  - ✅ Difficulty picker (single-select: Easy/Moderate/Hard/Expert)
  - ✅ Experience rating (single-select: Amazing/Good/Tough/Epic)
  - ✅ Notes field (collapsible, expandable textarea)
  - ✅ Custom tags (user-defined text tags)
  - ✅ Photo grid with upload progress indicators
  - ✅ Photo removal and caption editing
  - ✅ Form submission to `PUT /api/ascents/:id` endpoint
  - ✅ Query invalidation on successful submission

```
┌─────────────────────────────────────────────┐
│  Add Report                            ✕    │
│  Mt. Bierstadt · Dec 15, 2024               │
├─────────────────────────────────────────────┤
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │                                       │  │
│  │                                       │  │
│  │            📷 Add Photos              │  │
│  │                                       │  │
│  │           Tap to open camera          │  │
│  │                                       │  │
│  └───────────────────────────────────────┘  │
│                                             │
├─────────────────────────────────────────────┤
│  Conditions                                 │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│  │ 🧊   │ │ ✓    │ │ 🌧️   │ │ 💨   │       │
│  │ Icy  │ │ Good │ │Muddy │ │Windy │       │
│  └──────┘ └──────┘ └──────┘ └──────┘       │
│  ┌──────┐ ┌──────┐ ┌──────┐                │
│  │ ❄️   │ │ 🌫️   │ │ ☀️   │                │
│  │Snowy │ │Foggy │ │Clear │                │
│  └──────┘ └──────┘ └──────┘                │
├─────────────────────────────────────────────┤
│  Difficulty                                 │
│  ┌──────┐ ┌────────┐ ┌──────┐ ┌──────┐     │
│  │ Easy │ │Moderate│ │ Hard │ │ Epic │     │
│  └──────┘ └────────┘ └──────┘ └──────┘     │
├─────────────────────────────────────────────┤
│  Experience                                 │
│  ┌────────┐ ┌──────┐ ┌──────┐ ┌───────┐    │
│  │Amazing │ │ Good │ │ Tough│ │ Mixed │    │
│  └────────┘ └──────┘ └──────┘ └───────┘    │
├─────────────────────────────────────────────┤
│  Notes (optional)                     ▼     │
│  ┌───────────────────────────────────────┐  │
│  │                                       │  │
│  │                                       │  │
│  └───────────────────────────────────────┘  │
├─────────────────────────────────────────────┤
│                                             │
│            [ Submit Report ]                │
│                                             │
└─────────────────────────────────────────────┘
```

**Behavior:**
- ✅ Photo area: tap opens camera directly (not file picker) - **Implemented**
- ✅ Condition tags: multi-select - **Implemented**
- ✅ Difficulty: single-select - **Implemented**
- ✅ Experience: single-select - **Implemented**
- ✅ Notes: collapsed by default, tap to expand - **Implemented**
- ⏳ Offline: queues submission, syncs when online - **Pending (Phase 5)**

---

### 8. Manual Summit Entry

For peaks done without Strava activity.

```
┌─────────────────────────────────────────────┐
│  Log Manual Summit                     ✕    │
├─────────────────────────────────────────────┤
│                                             │
│  Search Peak                                │
│  ┌───────────────────────────────────────┐  │
│  │ 🔍 Search by name...                  │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Or select nearby:                          │
│  ┌───────────────────────────────────────┐  │
│  │ ▲ Mt. Bierstadt · 2.3 mi · 14,065 ft  │  │
│  │ ▲ Mt. Evans · 4.1 mi · 14,265 ft      │  │
│  │ ▲ Grays Peak · 6.8 mi · 14,270 ft     │  │
│  └───────────────────────────────────────┘  │
│                                             │
├─────────────────────────────────────────────┤
│  (After peak selected)                      │
├─────────────────────────────────────────────┤
│                                             │
│  Selected: Mt. Bierstadt                    │
│  14,065 ft · Front Range, Colorado          │
│                                             │
│  Summit Date                                │
│  ┌───────────────────────────────────────┐  │
│  │ December 15, 2024                  📅 │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │ ✓ You're within 0.2 mi of this peak   │  │
│  │   Location verified                    │  │
│  └───────────────────────────────────────┘  │
│                                             │
│            [ Log Summit ]                   │
│                                             │
│  After logging, you can add a trip report   │
│                                             │
└─────────────────────────────────────────────┘
```

**Behavior:**
- Search or select from nearby peaks (GPS)
- Date picker defaults to today
- GPS verification: shows green check if within threshold
- After logging: prompts to add trip report

---

### 9. Home - Dashboard

Personal dashboard with action-oriented cards.

```
┌─────────────────────────────────────────────┐
│  Good afternoon, Chris                  ⚙️  │
├─────────────────────────────────────────────┤
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │  🎉 You summited Grays Peak!            │ │
│ │     December 15, 2024 · via Strava      │ │
│ │                                         │ │
│ │           [ Add Report ]                │ │
│ └─────────────────────────────────────────┘ │
│                                             │
├─────────────────────────────────────────────┤
│  Your Stats                                 │
│  ┌────────┐  ┌────────┐  ┌────────┐        │
│  │   42   │  │ 58,000 │  │  10%   │        │
│  │ peaks  │  │ ft gain│  │ 14ers  │        │
│  └────────┘  └────────┘  └────────┘        │
├─────────────────────────────────────────────┤
│  Challenge Progress                         │
│ ┌─────────────────────────────────────────┐ │
│ │  CO 14ers  ████████░░░░  6/58           │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │  Front Range ██████████░  9/12          │ │
│ └─────────────────────────────────────────┘ │
│  2 more to reach 25% of CO 14ers!          │
├─────────────────────────────────────────────┤
│  Activity on Peaks You Follow               │
│ ┌─────────────────────────────────────────┐ │
│ │  @hiker42 reported on Mt. Evans         │ │
│ │  "Icy conditions, spikes needed"        │ │
│ │  2 hours ago                            │ │
│ └─────────────────────────────────────────┘ │
│                                             │
├─────────────────────────────────────────────┤
│   🏠 Home   │   🗺️ Explore   │   👤 You     │
└─────────────────────────────────────────────┘
```

**Sections:**
1. **Hero Card**: Unreviewed summit with Add Report CTA
2. **Quick Stats**: Total peaks, elevation gain, challenge %
3. **Challenge Progress**: Progress bars for favorited challenges
4. **Activity Feed**: Recent reports on peaks user has summited/favorited

---

### 10. You - List Mode (Default)

Profile with sub-tabs for different data views.

```
┌─────────────────────────────────────────────┐
│  Your Profile                    [🗺️ Map]  │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  Chris M.                           │    │
│  │  42 peaks · 58,000 ft · Since 2023  │    │
│  └─────────────────────────────────────┘    │
│                                             │
├─────────────────────────────────────────────┤
│  [Stats]  [Peaks]  [Journal]  [Challenges]  │
├─────────────────────────────────────────────┤
│                                             │
│   (Sub-tab content)                         │
│                                             │
├─────────────────────────────────────────────┤
│   🏠 Home   │   🗺️ Explore   │   👤 You     │
└─────────────────────────────────────────────┘
```

#### Stats Sub-tab
```
┌─────────────────────────────────────────────┐
│  All Time                                   │
│  ┌────────┐  ┌────────┐  ┌────────┐        │
│  │   42   │  │ 58,240 │  │   23   │        │
│  │ peaks  │  │ ft gain│  │ reports│        │
│  └────────┘  └────────┘  └────────┘        │
├─────────────────────────────────────────────┤
│  This Year (2024)                           │
│  ┌────────┐  ┌────────┐  ┌────────┐        │
│  │   18   │  │ 24,500 │  │   12   │        │
│  │ peaks  │  │ ft gain│  │ reports│        │
│  └────────┘  └────────┘  └────────┘        │
├─────────────────────────────────────────────┤
│  Activity by Month                          │
│  ┌─────────────────────────────────────┐    │
│  │  █                                  │    │
│  │  █     █                            │    │
│  │  █  █  █  █                         │    │
│  │  █  █  █  █     █  █                │    │
│  │  J  F  M  A  M  J  J  A  S  O  N  D │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

#### Peaks Sub-tab
```
┌─────────────────────────────────────────────┐
│  42 peaks summited                          │
│  [Recent]  [A-Z]  [Elevation]               │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ ▲ Grays Peak · 14,270 ft                │ │
│ │   Dec 15, 2024 · 2 times                │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ ▲ Torreys Peak · 14,267 ft              │ │
│ │   Dec 15, 2024 · 1 time                 │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ ▲ Mt. Evans · 14,265 ft                 │ │
│ │   Aug 3, 2024 · 1 time                  │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

#### Journal Sub-tab
```
┌─────────────────────────────────────────────┐
│  23 trip reports                            │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ Grays Peak · Dec 15, 2024               │ │
│ │ ★★★★☆ · Moderate · 🧊 Icy               │ │
│ │ "Started at 5am, ice on final stretch"  │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ Mt. Evans · Aug 3, 2024                 │ │
│ │ ★★★★★ · Easy · ☀️ Clear                 │ │
│ │ "Perfect summer day, drove to summit"   │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

#### Challenges Sub-tab
```
┌─────────────────────────────────────────────┐
│  4 challenges in progress                   │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ 🏔️ Colorado 14ers                       │ │
│ │ ████████░░░░░░░░░░░░░░  6/58 (10%)      │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ 🏔️ Front Range 14ers                    │ │
│ │ █████████████████░░░░  9/12 (75%)       │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ 🏔️ Sawatch Range                        │ │
│ │ ██░░░░░░░░░░░░░░░░░░░  2/15 (13%)       │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│        [ Browse More Challenges ]           │
└─────────────────────────────────────────────┘
```

---

### 11. You - Map Mode

Toggle from list mode to see all your summited peaks on a map.

```
┌─────────────────────────────────────────────┐
│  Your Peaks                      [📋 List] │
├─────────────────────────────────────────────┤
│                                             │
│                                             │
│                   MAP                       │
│                                             │
│        ▲ (summited)                         │
│              ▲                              │
│                  ▲    ▲                     │
│            ▲              ▲                 │
│                    ▲                        │
│                                             │
│                                             │
├─────────────────────────────────────────────┤
│  42 peaks · 58,000 ft total gain            │
├─────────────────────────────────────────────┤
│  Filter: [All] [2024] [14ers] [By Range]    │
├─────────────────────────────────────────────┤
│   🏠 Home   │   🗺️ Explore   │   👤 You     │
└─────────────────────────────────────────────┘
```

**Behavior:**
- All summited peaks shown as filled markers
- Tap marker → mini card with peak name + summit date(s)
- Tap mini card → navigate to Peak Detail
- Filter chips to narrow by year, challenge, range

---

### 12. Login Prompt

Shown when unauthenticated user tries auth-gated action.

```
┌─────────────────────────────────────────────┐
│                                        ✕    │
├─────────────────────────────────────────────┤
│                                             │
│                                             │
│               🏔️ PathQuest                  │
│                                             │
│         Track Your Summit Journey           │
│                                             │
│                                             │
│  Sign in to:                                │
│  • Save your summit history                 │
│  • Track challenge progress                 │
│  • Add trip reports and photos              │
│  • Favorite peaks and challenges            │
│                                             │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │                                       │  │
│  │      Connect with Strava              │  │
│  │                                       │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Your Strava activities are used to         │
│  automatically detect summit achievements.  │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

**Behavior:**
- Modal presentation over current screen
- Strava OAuth (PKCE) flow
- On success: dismiss modal, refresh current view
- On cancel: dismiss modal, return to previous state

---

### 13. Settings

Accessible from Home/You tab header.

```
┌─────────────────────────────────────────────┐
│  ← Settings                                 │
├─────────────────────────────────────────────┤
│                                             │
│  Account                                    │
│ ┌─────────────────────────────────────────┐ │
│ │ Chris M.                                │ │
│ │ chris@example.com                       │ │
│ │ Connected via Strava                  › │ │
│ └─────────────────────────────────────────┘ │
│                                             │
├─────────────────────────────────────────────┤
│  Preferences                                │
│ ┌─────────────────────────────────────────┐ │
│ │ Units                              ft › │ │
│ │ Distance                           mi › │ │
│ └─────────────────────────────────────────┘ │
│                                             │
├─────────────────────────────────────────────┤
│  Notifications                              │
│ ┌─────────────────────────────────────────┐ │
│ │ New reports on followed peaks      [ON] │ │
│ │ Challenge milestones               [ON] │ │
│ │ Weekly summary                    [OFF] │ │
│ └─────────────────────────────────────────┘ │
│                                             │
├─────────────────────────────────────────────┤
│  About                                      │
│ ┌─────────────────────────────────────────┐ │
│ │ Version                           1.0.0 │ │
│ │ Privacy Policy                        › │ │
│ │ Terms of Service                      › │ │
│ └─────────────────────────────────────────┘ │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│            [ Sign Out ]                     │
│                                             │
└─────────────────────────────────────────────┘
```

---

### 14. Onboarding (First Launch)

Brief introduction on first app launch.

```
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│                                             │
│               🏔️ PathQuest                  │
│                                             │
│         Track Your Summit Journey           │
│                                             │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │                                       │  │
│  │        [Illustration: Map with        │  │
│  │         peaks and progress]           │  │
│  │                                       │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Discover peaks nearby, track your          │
│  progress on challenges, and share          │
│  conditions with fellow peak baggers.       │
│                                             │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │      Connect with Strava              │  │
│  └───────────────────────────────────────┘  │
│                                             │
│           [ Explore Without Account ]       │
│                                             │
│               ○ ○ ○ (page dots)             │
│                                             │
└─────────────────────────────────────────────┘
```

**Behavior:**
- 2-3 swipeable pages introducing key features
- Primary CTA: Connect with Strava
- Secondary: Skip to browse mode

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
- Displayed on ALL map screens when permission granted:
  - Explore tab (Discovery mode)
  - Peak floating card view
  - Challenge floating card view
  - You tab (map mode)
- "Center on me" FAB button to recenter map on user location

**Usage Points:**
| Feature | Foreground | Background |
|---------|------------|------------|
| **Map location puck** | Yes | No |
| Discovery list sorting | Yes | No |
| Peak Detail GPS strip | Yes | No |
| Compass View | Yes | No |
| Manual Summit verification | Yes | No |
| Floating card distance | Yes | No |

**Update Frequency:**
- **Map puck**: Continuous while map visible (Mapbox handles this)
- Discovery list: on tab focus or pull-to-refresh
- Peak Detail GPS strip: every 5 seconds while visible
- Compass View: continuous (max 1Hz)

### Camera

**Expo Module:** `expo-camera` + `expo-image-picker`

**Permission Flow:**
1. On first photo tap in Add Report
2. Request `Permissions.CAMERA`
3. Fallback: Use `expo-image-picker` (photo library)

**Behavior:**
- Primary: Open camera directly
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

**Implementation:** TanStack Query with persistence

**Configuration:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 minutes
      gcTime: 24 * 60 * 60 * 1000, // 24 hours
    },
  },
});
```

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

## Component Architecture

**Status Legend:**
- ✅ = Implemented
- ⏳ = Partially implemented
- ⬜ = Not yet implemented

```
pathquest/
  src/
    components/
      explore/
        DiscoveryContent.tsx      ✅ Bottom sheet with peak/challenge list
        ExploreOmnibar.tsx        ✅ Search bar overlay
        FloatingPeakCard.tsx      ✅ Peak card overlay on map (with animations)
        FloatingChallengeCard.tsx ✅ Challenge card overlay on map (with progress)
        PeakRow.tsx               ✅ Peak list item
        ChallengeRow.tsx          ✅ Challenge list item
        PeakDetail.tsx            ✅ Main orchestrator with tab switching
        PeakDetailHero.tsx        ✅ Hero card with GPS strip and actions
        PeakDetailConditionsTab.tsx ✅ Weather + forecast + recent conditions
        PeakDetailCommunityTab.tsx ✅ Public summit reports (cursor-paginated)
        PeakDetailYourLogsTab.tsx ✅ User's summits + add report CTA
        PeakDetailForecastCard.tsx ✅ 7-day forecast horizontal scroller
        PeakDetailDaylightCard.tsx ✅ Sunrise/sunset + daylight duration
        ChallengeDetail.tsx       ✅ Complete redesign with hero card, Progress/Peaks tabs, animations
        DetailSkeleton.tsx         ✅ Loading skeleton for detail pages
      
      map/
        MapView.tsx               ✅ Full-screen Mapbox wrapper
        PeakMarkers.tsx           ✅ Peak markers layer (GeoJSON)
        ChallengeOverlay.tsx      ⬜ Challenge peak markers with progress
        LocationPuck.tsx          ✅ User location indicator (always visible)
        CenterOnMeButton.tsx      ✅ FAB to recenter on user location
        LineToTarget.tsx          ✅ Line from user to selected peak
        MapOverlayControls.tsx    ⬜ Toggle buttons for each overlay (Phase 7)
        WeatherOverlay.tsx        ⬜ Weather data rendering (Phase 7)
        SnowPackOverlay.tsx       ⬜ Snow pack data rendering (Phase 7)
        ParkAlertsOverlay.tsx     ⬜ Park alerts rendering (Phase 7)
        OverlayLegend.tsx         ⬜ Legend component for each overlay (Phase 7)
      
      home/
        DashboardContent.tsx      ✅ Main dashboard container
        QuickStats.tsx            ✅ Stats grid (peaks, elevation, challenge)
        SuggestedPeakCard.tsx   ✅ Suggested next peak hero card
        TripReportCTA.tsx         ✅ Unreported summit prompt
        FavoriteChallenges.tsx    ✅ Progress bars for challenges
        RecentSummits.tsx         ✅ Recent summits list (available, not in main layout)
      
      profile/ (You tab)
        ProfileContent.tsx        ✅ Container with sub-tabs
        ProfileHeader.tsx          ✅ User info + stats summary
        StatsContent.tsx          ✅ Detailed stats with charts
        PeaksContent.tsx          ✅ List of summited peaks
        JournalContent.tsx        ✅ Trip reports list
        ChallengesContent.tsx     ✅ Challenge progress list
        ReviewContent.tsx         ⬜ Summit review tab (unconfirmed summits with confirm/deny actions)
        ProfileMapView.tsx        ⬜ Map of user's peaks (map mode toggle pending)
      
      dashboard/ (Home tab)
        UnconfirmedSummitsCard.tsx ⬜ Dashboard card showing up to 3 unconfirmed summits (amber warning style)
      
      modals/
        AddReportModal.tsx        ✅ Trip report entry (camera-first, condition tags, difficulty/experience, notes, custom tags)
        ManualSummitModal.tsx     ✅ Manual summit logging (peak search, activity linking, date/time picker, difficulty/experience, notes)
        LoginPrompt.tsx           ⬜ Auth prompt modal (pending - needed for auth-gated actions)
      
      auth/ (Phase 6)
        EmailSignupScreen.tsx     ⬜ Email signup form
        EmailVerificationScreen.tsx ⬜ Magic link/code verification
        OAuthProviderButton.tsx   ⬜ Reusable OAuth provider button (Google, Apple, Strava)
        AccountLinkingScreen.tsx  ⬜ Link multiple auth providers
      
      settings/
        SettingsScreen.tsx        ⬜ User settings page (profile, account, app preferences)
        ConnectedDevicesScreen.tsx ⬜ Device connection management (Phase 6)
        ActivityImportScreen.tsx  ⬜ Review imported activities and detected summits (Phase 6)
      
      premium/ (Phase 7)
        PremiumBadge.tsx          ⬜ Badge showing premium status
        PremiumUpgradeModal.tsx   ⬜ Upgrade prompt modal
        AlertPreferencesScreen.tsx ⬜ Configure alert thresholds and methods
        SubscriptionManagementScreen.tsx ⬜ Manage subscription (in Settings)
      
      alerts/ (Phase 7)
        AlertListScreen.tsx       ⬜ List of all alerts (in-app notifications)
        AlertCard.tsx             ⬜ Individual alert card component
        AlertBadge.tsx            ⬜ Badge showing unread alert count
      
      ui/ (Design System Primitives)
        CardFrame.tsx             ✅ Reusable card wrapper (topo/ridge variants)
        PrimaryCTA.tsx            ✅ Primary action button (bevel, shadows)
        SecondaryCTA.tsx          ✅ Secondary action button
        TopoPattern.tsx           ✅ SVG contour line patterns
        MountainRidge.tsx         ✅ SVG mountain silhouette
        Text.tsx                  ✅ Typography component (Fraunces serif)
        Value.tsx                 ✅ Data display component (IBM Plex Mono)
      
      shared/
        GPSStrip.tsx              ✅ Distance/bearing/vert display
        TabSwitcher.tsx           ✅ Generic tab switcher component
        SummitCard.tsx            ✅ Reusable summit card (user/date with year/weather/tags/notes)
        StateFilterDropdown.tsx   ✅ State filter dropdown with modal selection
        WeatherDisplay.tsx        ✅ Compact weather row (temp/precip/clouds)
        WeatherBadge.tsx          ✅ Small badge pill (e.g. GOOD/FAIR/POOR)
        RefreshBar.tsx            ✅ Animated loading bar for data refresh states
        UserAvatar.tsx            ⬜ Reusable user avatar component (for Phase 3.5)
        ConditionTags.tsx         ⬜ Selectable condition chips (for Add Report modal)
        DifficultyPicker.tsx      ⬜ Difficulty selection (for Add Report modal)
        ExperiencePicker.tsx      ⬜ Experience rating selection (for Add Report modal)
        PhotoCapture.tsx          ⬜ Camera-first photo input (for Add Report modal)
        CollapsibleHeader.tsx     ⬜ Reanimated scroll header (not needed - using BottomSheetScrollView)
    
    store/
      mapStore.ts                 ✅ Map state (bounds, zoom, selection mode, visible peaks/challenges)
      sheetStore.ts               ✅ Sheet snap state (collapsed/halfway/expanded)
      authStore.ts                ✅ Auth state (tokens, user, login/logout)
    
    hooks/
      useLocation.ts              ✅ GPS location hook (Mapbox locationManager)
      useLocationPolling.ts       ✅ Polls device location on interval
      useMapData.ts               ✅ Fetch peaks/challenges for map bounds (useMapPeaks, useMapChallenges)
      useAllChallenges.ts         ✅ Fetch all challenges (for Explore "All" mode)
      useDashboardData.ts         ✅ Dashboard data (stats, recent summits, challenges)
      useSuggestedPeak.ts         ✅ Suggested peak with weather
      usePeakDetailData.ts        ✅ Peak detail hooks (usePeakDetails, usePeakWeather, usePeakForecast, usePeakActivity, usePeakPublicSummitsCursor)
      useChallengeDetails.ts      ✅ Challenge detail hook (useChallengeDetails)
      useUserChallengeProgress.ts ✅ User challenge progress hook (useUserChallengeProgress)
      useNextPeakSuggestion.ts   ✅ Next peak suggestion hook (useNextPeakSuggestion)
      useProfileData.ts           ✅ Profile data hooks (useUserProfile, useUserPeaks with filters, useUserJournal with filters, useUserSummitStates)
      useGPSNavigation.ts         ✅ GPS navigation (distance/bearing/vert calculations)
      useCompassHeading.ts       ✅ Magnetometer heading hook
      useCollapsibleHeader.ts     ⬜ Scroll-based header animation (not needed - using BottomSheetScrollView)
      useOfflineQueue.ts          ⬜ Queue actions for offline sync
      useAuthProviders.ts         ⬜ OAuth provider management (Phase 6)
      useEmailAuth.ts             ⬜ Email signup/verification hooks (Phase 6)
      useDeviceConnections.ts     ⬜ Device connection management (Phase 6)
      useActivityImport.ts        ⬜ Activity import and sync hooks (Phase 6)
      useSubscription.ts          ⬜ Check subscription status (Phase 7)
      useAlertPreferences.ts      ⬜ Manage alert preferences (Phase 7)
      useAlerts.ts                ⬜ Fetch and manage alerts (Phase 7)
    
    lib/
      location/
        permissions.ts            # Location permission helpers
        distance.ts               # Haversine distance calculation
        bearing.ts                # Bearing calculation
      camera/
        capture.ts                # Camera capture helpers
        exif.ts                   # EXIF extraction
      offline/
        queue.ts                  # Offline action queue
        sync.ts                   # Background sync
```

---

## State Management

### Location Store (`locationStore.ts`)

```typescript
interface LocationState {
  // Current position
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  accuracy: number | null;
  timestamp: number | null;
  
  // Permission state
  permissionStatus: 'undetermined' | 'granted' | 'denied';
  
  // Loading state
  isLocating: boolean;
  error: string | null;
  
  // Actions
  requestPermission: () => Promise<boolean>;
  startWatching: () => void;
  stopWatching: () => void;
  getCurrentPosition: () => Promise<void>;
}
```

### Selection Store (`selectionStore.ts`)

```typescript
interface SelectionState {
  // Selected item (for floating card)
  selectedPeakId: string | null;
  selectedChallengeId: string | null;
  
  // Actions
  selectPeak: (id: string) => void;
  selectChallenge: (id: string) => void;
  clearSelection: () => void;
}
```

### Offline Queue Store (`offlineStore.ts`)

```typescript
interface QueuedAction {
  id: string;
  type: 'add_report' | 'manual_summit' | 'upload_photo';
  payload: Record<string, unknown>;
  createdAt: number;
  retryCount: number;
}

interface OfflineState {
  queue: QueuedAction[];
  isSyncing: boolean;
  
  // Actions
  enqueue: (action: Omit<QueuedAction, 'id' | 'createdAt' | 'retryCount'>) => void;
  dequeue: (id: string) => void;
  processQueue: () => Promise<void>;
}
```

---

## API Requirements

**Status Legend:**
- ✅ = Implemented and in use
- ⬜ = Not yet implemented

### Existing Endpoints (pathquest-api)

| Endpoint | Method | Used In | Status |
|----------|--------|---------|--------|
| `/api/peaks/:id` | GET | Peak Detail | ⬜ |
| `/api/peaks/:id/summits` | GET | Peak Detail Community tab | ⬜ |
| `/api/peaks/search` | GET | Discovery search | ✅ |
| `/api/challenges/:id` | GET | Challenge Detail | ⬜ |
| `/api/challenges/:id/peaks` | GET | Challenge peaks list | ⬜ |
| `/api/users/:id/summits` | GET | You - Journal tab | ✅ |
| `/api/users/:id/peaks` | GET | You - Peaks tab | ✅ |
| `/api/users/:id/peaks/states` | GET | State filter dropdown | ✅ |
| `/api/users/:id/challenges` | GET | You - Challenges tab | ✅ |
| `/api/users/:id/profile` | GET | You - Profile data | ✅ |
| `/api/users/:id/stats` | GET | You - Stats tab, Home stats | ✅ |
| `/api/summits/:id/report` | POST | Add Report | ⬜ |
| `/api/peaks/:id/manual-summit` | POST | Manual Summit Entry | ⬜ |

### ✅ Implemented Endpoints

#### `GET /api/peaks/visible`
Returns peaks visible in the current map viewport.

**Query Parameters:**
- `bounds` (required): Map bounds object `{north, south, east, west}`
- `zoom` (optional): Map zoom level

**Status:** ✅ Implemented and used in `useMapData` hook

#### `GET /api/challenges/visible`
Returns challenges visible in the current map viewport.

**Query Parameters:**
- `bounds` (required): Map bounds object `{north, south, east, west}`
- `zoom` (optional): Map zoom level

**Status:** ✅ Implemented and used in `useMapData` hook

#### `GET /api/dashboard/stats`
Returns dashboard statistics (total peaks, total elevation, challenge progress).

**Status:** ✅ Implemented and used in `useDashboardData` hook

#### `GET /api/dashboard/recent-summits`
Returns user's recent summits (for trip report CTA).

**Query Parameters:**
- `limit` (optional): Max results (default: 10)

**Status:** ✅ Implemented and used in `useDashboardData` hook

#### `GET /api/dashboard/favorite-challenges`
Returns user's favorite challenges with progress.

**Status:** ✅ Implemented and used in `useDashboardData` hook

#### `GET /api/dashboard/suggested-peak`
Returns the suggested next peak (closest unclimbed from favorited challenges, or highest nearby peak as fallback) with current weather.

**Query Parameters:**
- `lat` (required): User's latitude
- `lng` (required): User's longitude
- `maxDistanceMiles` (optional): Max distance in miles (default: 100)

**Response:**
```json
{
  "peak": {
    "id": "abc123",
    "name": "Mt. Bierstadt",
    "elevation": 14065,
    "latitude": 39.5828,
    "longitude": -105.6686,
    "distance_miles": 2.3,
    "challenge": {
      "id": "challenge123",
      "name": "Colorado 14ers"
    }
  },
  "weather": {
    "temperature_f": 45,
    "wind_mph": 12,
    "conditions": "Partly Cloudy",
    "icon": "partly-cloudy"
  },
  "isFallback": false
}
```

**Status:** ✅ Implemented and used in `useSuggestedPeak` hook
- Includes fallback logic (highest nearby peak if no challenge peaks found)
- Integrates with Open-Meteo API for weather data
- Uses PostGIS for efficient distance calculations

#### `GET /api/users/:id/profile`
Returns user profile data including stats, accepted challenges, and completed challenges.

**Status:** ✅ Implemented and used in `useUserProfile` hook

#### `GET /api/users/:id/peaks`
Returns user's summited peaks with pagination and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Results per page (default: 50)
- `state` (optional): Filter by state (e.g., "Colorado")
- `search` (optional): Search peak names
- `sortBy` (optional): Sort order (`elevation`, `name`, `summits`, `recent`)

**Response:**
```json
{
  "peaks": [
    {
      "id": "abc123",
      "name": "Mt. Bierstadt",
      "elevation": 14065,
      "state": "Colorado",
      "summit_count": 2,
      "publicLand": {
        "name": "Arapaho National Forest",
        "type": "NF",
        "typeName": "National Forest",
        "manager": "USDA Forest Service"
      }
    }
  ],
  "totalCount": 42
}
```

**Status:** ✅ Implemented and used in `useUserPeaks` hook with state filtering

#### `GET /api/users/:id/summits`
Returns user's summit journal entries (all summits) with pagination and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Results per page (default: 30)
- `state` (optional): Filter by state (e.g., "Colorado")
- `search` (optional): Search peak names

**Response:**
```json
{
  "summits": [
    {
      "id": "summit123",
      "timestamp": "2024-12-27T10:30:00Z",
      "peak": {
        "id": "abc123",
        "name": "Mt. Bierstadt",
        "elevation": 14065,
        "state": "Colorado"
      },
      "notes": "Beautiful day!",
      "difficulty": "moderate",
      "experience_rating": "amazing",
      "condition_tags": ["clear", "windy"],
      "temperature": 45,
      "wind_speed": 15
    }
  ],
  "totalCount": 58
}
```

**Status:** ✅ Implemented and used in `useUserJournal` hook with state filtering

#### `GET /api/users/:id/peaks/states`
Returns list of states where the user has summited peaks (for filter dropdown).

**Response:**
```json
{
  "states": ["Colorado", "Wyoming", "Utah"]
}
```

**Status:** ✅ Implemented and used in `useUserSummitStates` hook

### New Endpoints Needed

#### `GET /api/peaks/nearby`

Returns peaks near a location, sorted by distance.

**Query Parameters:**
- `lat` (required): Latitude
- `lng` (required): Longitude
- `radius` (optional): Radius in miles (default: 50)
- `limit` (optional): Max results (default: 50)
- `challengeId` (optional): Filter to peaks in a challenge

**Response:**
```json
{
  "peaks": [
    {
      "id": "abc123",
      "name": "Mt. Bierstadt",
      "elevation": 14065,
      "latitude": 39.5828,
      "longitude": -105.6686,
      "distance_miles": 2.3,
      "class": "2",
      "summited": true,
      "summit_count": 2
    }
  ]
}
```

#### `GET /api/users/:id/activity-feed`

Returns recent activity on peaks the user has summited or favorited.

**Query Parameters:**
- `limit` (optional): Max results (default: 20)

**Response:**
```json
{
  "activities": [
    {
      "type": "report",
      "peak_id": "abc123",
      "peak_name": "Mt. Evans",
      "user_name": "hiker42",
      "excerpt": "Icy conditions, spikes needed",
      "created_at": "2024-12-27T10:30:00Z"
    }
  ]
}
```

#### `GET /api/weather/current`

Returns current weather for a location (proxy to Open-Meteo).

**Query Parameters:**
- `lat` (required): Latitude
- `lng` (required): Longitude

**Response:**
```json
{
  "temperature_f": 42,
  "wind_speed_mph": 12,
  "wind_direction": "NW",
  "conditions": "Clear"
}
```

---

## Infrastructure Requirements

### Photo Storage (New)

Photo uploads require new infrastructure that doesn't exist yet.

#### Google Cloud Storage Bucket

**Bucket Setup:**
- Bucket name: `pathquest-photos` (or similar)
- Location: Same region as Cloud SQL (for latency)
- Storage class: Standard
- Access control: Uniform (not fine-grained)
- Public access: Prevented (use signed URLs)

**Folder Structure:**
```
pathquest-photos/
  photos/
    {user_id}/
      {uuid}.jpg           # Original (compressed to ~2MB)
      {uuid}_thumb.jpg     # Thumbnail (400px wide)
```

**CORS Configuration:**
```json
[
  {
    "origin": ["https://pathquest.app", "pathquest://"],
    "method": ["GET", "PUT"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```

**Service Account:**
- Create service account with `Storage Object Admin` role
- Used by `pathquest-api` to generate signed URLs

#### Database Schema

New table for storing photo metadata:

```sql
CREATE TABLE summit_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to summit (one of these must be non-null)
  activities_peaks_id UUID REFERENCES activities_peaks(id) ON DELETE CASCADE,
  user_peak_manual_id UUID REFERENCES user_peak_manual(id) ON DELETE CASCADE,
  
  -- Owner
  user_id UUID REFERENCES users(id) NOT NULL,
  
  -- Storage info
  storage_path TEXT NOT NULL,        -- GCS path: photos/{user_id}/{uuid}.jpg
  thumbnail_path TEXT NOT NULL,      -- GCS path: photos/{user_id}/{uuid}_thumb.jpg
  
  -- Metadata
  original_filename VARCHAR(255),
  mime_type VARCHAR(50),
  size_bytes INTEGER,
  width INTEGER,
  height INTEGER,
  caption TEXT,
  taken_at TIMESTAMP,                -- EXIF extracted if available
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraint: must belong to either activity summit or manual summit
  CONSTRAINT photo_parent_check CHECK (
    (activities_peaks_id IS NOT NULL AND user_peak_manual_id IS NULL) OR
    (activities_peaks_id IS NULL AND user_peak_manual_id IS NOT NULL)
  )
);

-- Indexes for common queries
CREATE INDEX idx_summit_photos_user ON summit_photos(user_id);
CREATE INDEX idx_summit_photos_activities_peaks ON summit_photos(activities_peaks_id);
CREATE INDEX idx_summit_photos_manual ON summit_photos(user_peak_manual_id);
```

#### Photo Upload API Endpoints

**`POST /api/photos/upload-url`**

Returns a signed URL for direct upload to GCS.

Request:
```json
{
  "filename": "summit.jpg",
  "contentType": "image/jpeg",
  "summitType": "activity",        // "activity" or "manual"
  "summitId": "abc123"
}
```

Response:
```json
{
  "uploadUrl": "https://storage.googleapis.com/...",
  "photoId": "def456",
  "storagePath": "photos/user123/def456.jpg"
}
```

**`POST /api/photos/:id/complete`**

Called after upload completes. Triggers thumbnail generation.

Request:
```json
{
  "width": 4032,
  "height": 3024,
  "takenAt": "2024-12-15T10:30:00Z"   // Optional, from EXIF
}
```

Response:
```json
{
  "id": "def456",
  "thumbnailUrl": "https://storage.googleapis.com/..."
}
```

**`DELETE /api/photos/:id`**

Deletes photo from GCS and database (owner only).

**`GET /api/peaks/:id/photos`**

Returns public photos for a peak (from public summit reports).

Response:
```json
{
  "photos": [
    {
      "id": "def456",
      "thumbnailUrl": "https://...",
      "fullUrl": "https://...",
      "caption": "Summit view",
      "takenAt": "2024-12-15T10:30:00Z",
      "userName": "hiker42"
    }
  ]
}
```

#### Image Processing

**Option A: Server-side (Recommended for v1)**
- Use `sharp` library in `pathquest-api`
- Generate thumbnail after upload complete callback
- Async processing (don't block the response)

**Option B: Cloud Functions (Future)**
- GCS trigger on new object
- Automatic thumbnail generation
- Better for scale

**Processing Steps:**
1. Validate image (MIME type, size < 10MB)
2. Strip EXIF location data (privacy)
3. Preserve EXIF timestamp
4. Compress original to ~2MB max (preserve aspect ratio)
5. Generate 400px wide thumbnail

#### Native App Upload Flow

```
1. User taps "Add Photo" in Add Report modal
2. Open camera (or photo picker)
3. Capture/select photo
4. Extract EXIF metadata (expo-image-manipulator)
5. Compress image client-side (optional, reduces upload time)
6. Call POST /api/photos/upload-url
7. PUT image to signed URL
8. Call POST /api/photos/:id/complete
9. Display thumbnail in modal
10. On form submit, photo IDs are included in report payload
```

#### Offline Handling

Photos captured offline are stored locally:
- Save to `FileSystem.documentDirectory`
- Queue metadata in offline store
- On connectivity: upload in background
- Show "pending upload" indicator

---

## Implementation Phases

### Implementation Status Summary

**Completed:**
- ✅ Phase 1: Core Navigation + Explore
- ✅ Phase 2: Peak Detail + GPS (fully implemented with all tabs, GPS navigation, and compass)
- ✅ Phase 2.5: Compass View (full-screen compass with magnetometer integration)
- ✅ Phase 2.9: Challenge Detail (complete redesign with hero card, Progress/Peaks tabs, animations, "Show on Map")
- ✅ Phase 3: Home Dashboard + You Tab data fetching
- ✅ Phase 4: Actions + Modals + User Settings
  - ✅ Add Report Modal (camera-first photo capture, condition tags, difficulty/experience ratings, notes, custom tags)
  - ✅ Settings Screen (account info, units preference, privacy toggles, sign out, delete account)
  - ✅ Manual Summit Entry (peak search, activity linking with elevation profile, date/time picker with timezone, difficulty/experience ratings, trip notes)
- ✅ Visual Design System (all primitives and theme)
- ✅ Icon migration (FontAwesome → Lucide icons)
- ✅ Typography system (Text/Value components)
- ✅ Real API integration (dashboard, map data, suggested peak, peak details, weather, forecasts)
- ✅ Location services (Mapbox locationManager integration)
- ✅ GPS navigation hooks (`useGPSNavigation`, `useCompassHeading`)
- ✅ Expo Router navigation (file-based routing with native stack)
- ✅ RefreshBar component (loading indicators across Home, Explore, Profile)
- ✅ Optimistic updates and cache invalidation (challenge accept/un-accept)
- ✅ Performance optimizations (peak limit: 200 max, client-side safeguard)

**In Progress:**
- None (Phase 2.9 completed)

**Recent UI Improvements (Latest Session):**
- ✅ **Visual Consistency Improvements:**
  - Removed slow, bouncy animation from FloatingPeakCard - replaced with quick micro-animation (150ms timing)
  - Moved challenge hero card below back/X buttons (buttons now render above hero card)
  - Removed "Profile" text header from public profile page, adjusted hero card spacing
  - Removed "summit to extend" text from climbing streak in profile tab (now shows just "X month(s) in a row")
- ✅ **Date Formatting Fixes:**
  - Created `parseDate()` and `formatDateString()` helper functions in `formatting.ts` for safe date parsing
  - Fixed "Invalid date" errors in challenge detail recent summits timeline
  - Updated database query (`getChallengePeaksForUser`) to return date-only strings (YYYY-MM-DD) instead of full timestamps
  - Removed strict date validation filters that were hiding valid dates
- ✅ **Map Controls Repositioning:**
  - Moved map controls (compass, location, snapping/recenter) to top right, below search bar
  - Controls now stack vertically (top-down order: compass → location → snapping)
  - Added custom CompassButton component (replaces built-in Mapbox compass)
  - Added `resetBearing()` method to MapView ref for compass functionality
  - Increased padding above controls (24px gap below search bar)
  - All buttons standardized to 44x44px for consistency
- ✅ **Profile Tab Improvements:**
  - Moved "View on Map" button underneath name and location (instead of next to it)
  - Styled button with inverted green theme (light green background with green text/border)
  - Button uses `alignSelf: 'flex-start'` to prevent full-width layout
- ✅ **Bug Fixes:**
  - Fixed PeakDetailChallenges skeleton showing text inside gray background during loading
  - Fixed profile hero card margin issue (moved padding to parent View instead of CardFrame)

**Pending:**
- ⏳ Phase 3: You tab map mode toggle
- ⏳ Phase 3.5: User Profile & Challenge Progress Pages (User Detail, User Challenge Progress) + Improve Search Bar Functionality
- ⏳ Phase 3.9: Photo Infrastructure (Backend) - **Photo upload/gallery frontend ✅ IMPLEMENTED**
- ✅ Phase 4: Actions + Modals + User Settings
  - ✅ Add Report Modal - **IMPLEMENTED**
  - ✅ Settings Page - **IMPLEMENTED**
  - ✅ Manual Summit Entry - **IMPLEMENTED** (peak search, activity linking, date/time picker, difficulty/experience ratings, trip notes)
  - ⏳ Login Prompt - **Pending** (auth-gated actions need login prompts)
- ⏳ Phase 5: Polish + Offline
  - ⏳ Offline queue for reports
  - ⏳ TanStack Query persistence
  - ⏳ Onboarding flow
  - ⏳ Push notification setup
- ⏳ Phase 6: Auth & Data Integrations (Multiple OAuth providers, Email signup, Fitness device integrations)
- ⏳ Phase 7: Premium Features (Subscription system, Proactive alerts, Map overlays)

---

### ✅ Phase 1: Core Navigation + Explore (COMPLETED)
- ✅ 3-tab navigation shell (Home, Explore, You)
- ✅ Explore tab with map + discovery sheet
- ✅ Peak floating card (`FloatingPeakCard` with quick micro-animations)
- ✅ Challenge floating card (`FloatingChallengeCard` with progress)
- ✅ Location puck on map (always visible)
- ✅ Map controls positioned top-right, below search bar:
  - CompassButton (resets map bearing to north)
  - CenterOnMeButton (centers map on user location)
  - Recenter button (fits bounds for challenge/user/peak focus)
  - Controls stack vertically with consistent 44x44px sizing
- ✅ LineToTarget component (dashed line to selected peak)
- ✅ Selection mode state management (none/floating/detail)
- ✅ Real data fetching from API (peaks/challenges for map bounds)
- ✅ Map data refresh on camera movement
- ✅ ExploreOmnibar search functionality

### ✅ Phase 2: Peak Detail + GPS (COMPLETED)
- ✅ Peak Detail orchestrator component (`PeakDetail.tsx`)
- ✅ Hero card (`PeakDetailHero`) with GPS strip (distance/bearing/elevation gain)
  - Uses `CardFrame` with `variant="hero"`, `topo="full"`, `ridge="bottom"`
  - Theme colors and accent washes (green for unsummited, blue for summited)
  - Status chip (SUMMITED/UNSUMMITED)
  - Compass and Navigate action buttons
  - Add Report CTA (when applicable)
- ✅ Conditions Tab (`PeakDetailConditionsTab`)
  - Current weather display with wind direction arrows
  - 7-day forecast horizontal scroller (`PeakDetailForecastCard`)
  - Daylight card (`PeakDetailDaylightCard`) with sunrise/sunset
  - Recent condition tags and reports with notes
- ✅ Community Tab (`PeakDetailCommunityTab`)
  - Cursor-paginated public summits list
  - Activity summary header
  - `SummitCard` components for each summit
  - Load more functionality
- ✅ Your Logs Tab (`PeakDetailYourLogsTab`)
  - Auth-gated user ascents display
  - Unreported ascent detection and CTA
  - Login prompt for unauthenticated users
  - Weather display for each ascent
- ✅ GPS Navigation (`useGPSNavigation` hook)
  - Real-time distance, bearing, and vertical calculations
  - Polls device location on configurable interval
  - Handles missing location gracefully
- ✅ Data Fetching Hooks
  - `usePeakDetails` - Full peak data with ascents/challenges
  - `usePeakWeather` - Current weather conditions
  - `usePeakForecast` - 7-day forecast
  - `usePeakActivity` - Activity summary (summits this week/month)
  - `usePeakPublicSummitsCursor` - Cursor-paginated public summits
- ✅ Location permission flow (integrated with Mapbox locationManager)

### ✅ Phase 2.5: Compass View (COMPLETED)
- ✅ Full-screen compass screen (`app/compass/[peakId].tsx`)
- ✅ Magnetometer integration (`useCompassHeading` hook)
- ✅ Rotating arrow pointing toward peak
- ✅ GPS strip with distance/bearing/vert
- ✅ Cardinal directions (N/S/E/W) display
- ✅ "Open in Maps" and "Refresh GPS" actions
- ✅ CardFrame styling with topo patterns

### ✅ Phase 2.9: Challenge & Activity Detail Pages (COMPLETED)

**Challenge Detail Page (COMPLETED):**
- ✅ Component exists (`ChallengeDetail.tsx`)
- ✅ **Redesigned hero card** with topographic styling:
  - Color-coded hero card (green for un-accepted, amber for accepted, blue for completed)
  - Circular progress indicator with completion percentage
  - CompassRose decorative element
  - Milestone badges (circular, stamp-like, animated)
  - "Accept Challenge" primary CTA (or "Challenge Accepted" badge with un-accept functionality)
  - "Share" button for sharing challenge progress (generates deep link to user's challenge progress page)
  - Hero card positioned below navigation buttons (back/X buttons render above hero card)
  - Auto-show on map: Challenge peaks automatically displayed when viewing challenge detail
- ✅ **Progress Tab** - "Your Expedition Log":
  - Next Objective card with CompassRose, cardinal direction, distance, elevation
  - Fallback logic for peaks when location unavailable or far from challenge
  - Recent summits timeline with SummitCheckBadge and formatted dates
  - Completion celebration styling (blue accent, "Challenge Complete!" message)
  - Staggered fade and slide animations
- ✅ **Peaks Tab** - "The Route":
  - Default sort by elevation (descending)
  - Filter buttons: "All", "Summited", "Remaining" (with counts)
  - Peak rows with SummitMedal badges (retro boy scout medal style with summit count)
  - UnsummitedBadge for uncompleted peaks
  - Distance and elevation display
  - Sort options: elevation, distance, A-Z
- ✅ Data fetching hooks implemented:
  - `useChallengeDetails` - Fetches challenge data
  - `useUserChallengeProgress` - Fetches user-specific progress and peak status
  - `useNextPeakSuggestion` - Fetches closest unsummited peak
- ✅ **Map Integration:**
  - Auto-show challenge peaks on map when viewing challenge detail
  - Calculates bounding box of challenge peaks
  - Fits map with asymmetric padding (accounts for omnibar, drawer, tab bar)
  - Shows ONLY challenge peaks (hides other map markers)
  - Clears overlay when navigating away or returning to discovery view
  - Recenter button available to refit bounds when needed
- ✅ Navigation:
  - Back button (←) for navigation history
  - Dismiss button (X) to return directly to discovery view
  - Native swipe-back gesture support via Expo Router
- ✅ Loading states:
  - `DetailSkeleton` component for initial load
  - Shimmer animations
- ✅ Cache invalidation:
  - Optimistic updates for accept/un-accept challenge
  - Proper cache invalidation across all related queries (dashboard, profile, map, etc.)
- ✅ API integration:
  - `/api/challenges/:id` - Public challenge details
  - `/api/challenges/:id/progress` - User challenge progress with summit counts
  - `/api/challenges/:id/next-peak` - Next peak suggestion
  - `/api/challenges/:id/favorite` - Accept/un-accept challenge

**Activity Detail Page (NOT STARTED):**
- Full activity view with map, elevation profile, splits
- Summit markers on elevation profile
- Weather conditions during activity
- Linked peaks summited during activity
- Share/export functionality

### ✅ Phase 3: Home + You Tabs (PARTIALLY COMPLETED)
**Home Dashboard (COMPLETED):**
- ✅ Quick Stats component (3 lifetime metrics: total peaks, total elevation, closest challenge)
- ✅ Suggested Peak Card hero (`SuggestedPeakCard` with weather)
- ✅ Trip Report CTA (`TripReportCTA` for unreported summits)
- ✅ Favorite Challenges list (`FavoriteChallenges`)
- ✅ Dashboard data hooks (`useDashboardData`, `useSuggestedPeak`)
- ✅ `/dashboard/suggested-peak` API endpoint (with fallback to highest nearby peak)
- ✅ Screen-level topo pattern backdrop
- ✅ Real data integration (API calls, loading states, error handling)

**You Tab (UI POLISH COMPLETE):**
- ✅ Profile component structure (`ProfileContent.tsx`)
- ✅ Sub-tab navigation (Stats, Peaks, Journal, Challenges)
- ✅ Sub-tab components exist (`StatsContent`, `PeaksContent`, `JournalContent`, `ChallengesContent`)
- ✅ **Data fetching implemented** via `useProfileData` hook:
  - `useUserProfile`: Fetches stats and accepted challenges via `/api/users/:id/profile`
  - `useUserPeaks`: Fetches summited peaks via `/api/users/:id/peaks`
  - `useUserJournal`: Fetches journal entries (summits with notes) via `/api/users/:id/summits`
- ✅ Loading states for each sub-tab

**You Tab UI Polish (COMPLETED):**
- ✅ **Profile Header** - Expedition card style with gradient accent bar, avatar ring, user info
- ✅ **StatsContent** - "The Summit Registry" design:
  - Hero card with CompassRose decoration and topo pattern
  - Large summit count with secondary stats (total summits, elevation)
  - Crown Jewel card for highest peak (award badge, CardFrame styling)
  - Milestone badges (Trophy, States, Countries) with animated reveal
  - "Your Journey" section with universal stats (elevation range, climbing streak, favorite peak)
  - All journey stats computed by backend (`/api/users/:id/profile`)
  - Staggered animation on card appearance
- ✅ **PeaksContent** - "The Summit Collection" design:
  - Collection header with peak count and stats
  - **State filter dropdown** (server-side filtering via API)
  - Sort bar (elevation, name, summits) with toggle direction
  - Enhanced peak rows with SummitCountIcon (flag icon with count)
  - Public land badge display (when available)
  - Pagination support with "Load more" button
  - Staggered slide-in animations
- ✅ **JournalContent** - "The Field Notes" design:
  - **State filter dropdown** (server-side filtering via API)
  - "With notes" toggle filter (client-side)
  - DateStamp component (vintage passport entry style) **with year display**
  - Journal entry cards with CardFrame styling
  - Condition tags with color coding
  - Notes displayed in italics with quote styling
  - Weather data display when available
  - Pagination support with "Load more" button
  - Staggered fade-in animations
- ✅ **ChallengesContent** - "The Trophy Case" design:
  - Hero card with trophy case stats
  - CircularProgress ring indicators for each challenge
  - CompletionBadge (star) for completed challenges
  - Progress bars with animated fill
  - In Progress vs Completed sections
  - "Almost there" indicators when close to completion
- ✅ **Login Screen** - Enhanced with gradient background, larger CTA, better copy
- ⏳ Map mode toggle (not yet implemented)

### ✅ Loading States & Refresh Indicators (COMPLETED)

**RefreshBar Component:**
- ✅ Thin animated loading bar at top of screens
- ✅ Indeterminate shimmer animation (left-to-right loop)
- ✅ Fades in/out smoothly (150ms in, 300ms out)
- ✅ Uses primary theme color (green)
- ✅ Positioned absolutely at top (z-index: 100)
- ✅ Non-interactive (pointerEvents="none")

**Implementation:**
- ✅ **Home Tab**: Tracks `dashboardStats`, `favoriteChallenges`, `recentSummits`, `suggestedPeak`
- ✅ **Profile Tab**: Tracks `userProfile`, `userPeaks`, `userJournal`
- ✅ **Explore Tab**: Tracks `mapPeaks`, `mapChallenges`, `allChallenges`, `peakDetails`, `challengeDetails`
- ✅ Uses TanStack Query's `useIsFetching` hook to detect background refetches
- ✅ Shows during both initial loads and background refreshes

**Detail Page Loading:**
- ✅ `DetailSkeleton` component for peak/challenge detail pages
- ✅ Shimmer animations for loading states
- ✅ Functional back button during loading
- ✅ Prevents "Unknown Peak" flash by waiting for valid data

### ✅ Performance Optimizations (COMPLETED)

**Peak Fetching Limits:**
- ✅ Maximum 200 peaks per map viewport fetch
- ✅ Client-side safeguard: Caps results if API returns more than 200
- ✅ Prevents app crashes on wide zoom levels
- ✅ Proper pagination: Sends `page: '1'` along with `perPage: '200'` to ensure API applies LIMIT

**Cache Management:**
- ✅ Optimistic updates for challenge accept/un-accept
- ✅ Proper cache invalidation across all related queries:
  - `challengeDetails` (detail page)
  - `mapChallenges` (map markers)
  - `allChallenges` (explore list)
  - `favoriteChallenges` (dashboard)
  - `dashboardStats` (dashboard)
  - `userProfile` (profile page)
- ✅ TanStack Query optimistic update pattern with rollback on error

### ✅ Visual Design System (COMPLETED)
**UI Primitives:**
- ✅ `CardFrame` component (with variants: default/hero/cta, topo patterns, ridge silhouettes)
- ✅ `PrimaryCTA` component (bevel, shadows, pressed states, custom colors)
- ✅ `SecondaryCTA` component (border, moderate shadow)
- ✅ `TopoPattern` SVG component (deterministic seeding, variants: full/corner/subtle)
- ✅ `MountainRidge` SVG component (variants: jagged/rolling/sharp)

**Theme System:**
- ✅ System-following light/dark mode (`useSystemColorScheme`)
- ✅ Theme colors (`colors.ts` with light/dark palettes)
- ✅ `ThemeProvider` and `useTheme` hook
- ✅ Navigation theme matches app theme
- ✅ Contour ink colors for topo patterns

**Typography:**
- ✅ Custom `Text` component (Fraunces serif font)
- ✅ Custom `Value` component (IBM Plex Mono monospace font)
- ✅ Font weights and styling utilities

**Component Integration:**
- ✅ QuickStats uses `CardFrame` with topo patterns
- ✅ SuggestedPeakCard uses `CardFrame` (hero variant) with ridge
- ✅ TripReportCTA uses `CardFrame` (hero variant) with ridge
- ✅ FavoriteChallenges uses `CardFrame` for each item
- ✅ PeakDetailHero uses `CardFrame` (hero variant) with full topo pattern and ridge
- ✅ PeakDetailConditionsTab uses `CardFrame` for weather and forecast cards
- ✅ PeakDetailCommunityTab uses `CardFrame` for activity summary
- ✅ Compass screen uses `CardFrame` for compass display
- ✅ All CTAs use `PrimaryCTA`/`SecondaryCTA` components
- ✅ Theme colors applied throughout dashboard and peak detail
- ✅ **Profile Tab Components:**
  - StatsContent: CardFrame (hero) with CompassRose, MilestoneBadge, TerrainBand
  - PeaksContent: EnhancedPeakRow with SummitCountIcon, PublicLandDisplay
  - JournalContent: CardFrame with DateStamp (with year), ConditionTag, SummitCard
  - ChallengesContent: CardFrame (hero) with CircularProgress, CompletionBadge

**Profile Tab Filtering (COMPLETED):**
- ✅ **StateFilterDropdown** component:
  - Pill-style dropdown button with MapPin icon
  - Modal bottom sheet for state selection
  - Checkmarks indicate selected state
  - "All States" option to clear filter
  - Fetches available states via `useUserSummitStates` hook
- ✅ **Peaks Tab Filtering:**
  - Server-side state filtering via `/api/users/:id/peaks?state=Colorado`
  - Filter resets pagination to page 1
  - Total count updates based on filtered results
  - Clear button appears when filter is active
- ✅ **Journal Tab Filtering:**
  - Server-side state filtering via `/api/users/:id/summits?state=Colorado`
  - Client-side "With notes" toggle filter
  - Both filters work together (state filter applied server-side, notes filter client-side)
  - Filter resets pagination to page 1
  - Total count updates based on filtered results
- ✅ **API Updates:**
  - `searchUserSummits` helper accepts `state` parameter
  - `/api/users/:id/summits` endpoint accepts `state` query parameter
  - `useUserJournal` hook accepts `JournalFilters` with `state` field
  - `useUserPeaks` hook accepts `PeaksFilters` with `state` field
  - `useUserSummitStates` hook fetches available states for dropdown

### Phase 3.5: User Profile & Challenge Progress Pages + Improve Search Bar Functionality

Build out user profile and challenge progress detail pages, following the same design patterns established in Peak Detail:

**User Detail Page (Profile):**
- Hero card with user name, avatar, location, and stats summary
- Tabs: "Stats", "Summits", "Challenges", "Activity" (if authenticated and viewing own profile)
- **Stats tab**: Lifetime statistics (total peaks, total elevation, climbing streak, favorite regions, etc.)
  - Similar to web profile stats page
  - Visual charts/graphs for elevation over time, peaks by month/year
  - Achievement badges/milestones
- **Summits tab**: List of user's summited peaks with dates and photos
- **Challenges tab**: Active challenge progress and completed challenges
- **Activity tab**: Recent activity feed (summits, reports, etc.)
- Public profile view for other users (limited tabs/data - Stats and Summits only)

**User Challenge Progress Detail:**
- Focused view of a user's progress on a specific challenge
- Progress visualization (completion percentage, milestones)
- List of summited peaks with dates
- List of remaining peaks sorted by distance
- "View Challenge" link to full challenge detail

**Improve Search Bar Functionality:**
- Enhanced search experience in ExploreOmnibar
- Better search result ranking and relevance
- Search history/predictions
- Quick filters (peaks only, challenges only, nearby)
- Improved autocomplete suggestions
- Search result highlighting

**Add User Profile Icons Throughout App:**
- Display user profile pictures/avatars wherever users are shown:
  - **Peak Detail Community Tab**: User avatars next to public summit reports
  - **Challenge Detail**: User avatars in progress/activity sections
  - **Home Dashboard**: User avatar in header/profile section
  - **You Tab**: User avatar in profile header (already implemented)
  - **Search Results**: User avatars for user-related results
  - **Activity Feeds**: User avatars in activity timelines
  - **Comments/Notes**: User avatars next to user-generated content
- Fallback to initials or default icon when profile picture unavailable
- Consistent avatar sizing and styling across components
- Support for circular avatars with border styling
- Lazy loading and caching of profile images

**Implementation Notes:**
- Reuse Peak Detail component patterns (hero card, tabs, CardFrame styling)
- Create shared hooks: `useUserProfile`, `useUserStats`, `useUserChallengeProgress`
- Wire up existing API endpoints: `/api/users/:id`, `/api/users/:id/stats`, `/api/challenges/:id/progress`
- Ensure consistent navigation patterns (back button, deep linking)
- Add loading/error states matching Peak Detail patterns
- Stats tab should match web app profile stats design
- Enhance `/api/peaks/search` and `/api/challenges/search` endpoints for better search functionality
- Create reusable `UserAvatar` component for consistent profile icon display
- Implement image caching strategy for profile pictures

### Phase 3.9: Photo Infrastructure (Backend)
**Prerequisites for Phase 4 photo uploads:**
- Create GCS bucket (`pathquest-photos`)
- Configure CORS and service account
- Run database migration for `summit_photos` table
- Implement photo API endpoints in `pathquest-api`:
  - `POST /api/photos/upload-url`
  - `POST /api/photos/:id/complete`
  - `DELETE /api/photos/:id`
  - `GET /api/peaks/:id/photos`
- Add `sharp` for server-side image processing
- Test signed URL upload flow

### ✅ Phase 4: Actions + Modals + User Settings (COMPLETED)

**Add Report Modal:** ✅ **IMPLEMENTED**
- ✅ Trip report entry form with camera integration (`AddReportModal.tsx`)
- ✅ Photo capture + upload flow (GCS signed URLs with progress tracking)
- ✅ Condition tags selection (multi-select with emoji chips)
- ✅ Difficulty picker (single-select: Easy/Moderate/Hard/Expert)
- ✅ Experience rating (single-select: Amazing/Good/Tough/Epic)
- ✅ Notes field (collapsible, expandable textarea)
- ✅ Custom tags (user-defined text tags)
- ✅ Form submission to `PUT /api/ascents/:id` endpoint

**Settings Screen:** ✅ **IMPLEMENTED**
- ✅ Account info display
- ✅ Units preference (metric/imperial)
- ✅ Privacy toggles (public/private profile)
- ✅ Sign out functionality
- ✅ Delete account functionality

**Manual Summit Entry:** ✅ **IMPLEMENTED**
- ✅ Component: `ManualSummitModal.tsx` (fully implemented)
- ✅ Store: `manualSummitStore.ts` (Zustand state management)
- ✅ Peak search functionality (when opened from Profile tab)
- ✅ Pre-selected peak display (when opened from Peak Detail)
- ✅ Optional activity linking with nearby activity search
- ✅ Elevation profile selector (tap to set summit time)
- ✅ Date/time picker with auto-detected timezone (via API)
- ✅ Difficulty + experience rating grids
- ✅ Trip notes field
- ✅ Integration: Wired into Profile tab and Peak Detail "Your Logs" tab
- ✅ Difficulty picker (single-select: Easy/Moderate/Hard/Expert)
- ✅ Experience rating (single-select: Amazing/Good/Tough/Epic)
- ✅ Notes field (collapsible textarea)
- ✅ Custom tags (user-defined text tags)
- ✅ Photo grid with upload progress and removal
- ✅ Form submission to `PUT /api/ascents/:id` endpoint
- ✅ State management via `addReportStore` (Zustand)
- Optional notes field
- Weather data pre-population
- Submit with offline queue support

**Manual Summit Entry:** ✅ **IMPLEMENTED**
- ✅ Component: `ManualSummitModal.tsx` (fully implemented, ~1200 lines)
- ✅ Store: `manualSummitStore.ts` (Zustand state management)
- ✅ Peak search functionality (when opened from Profile tab without pre-selection)
- ✅ Pre-selected peak display (when opened from Peak Detail "Your Logs" tab)
- ✅ Optional activity linking with nearby activity search
- ✅ Elevation profile selector (tap to set summit time from activity)
- ✅ Date/time picker with auto-detected timezone (via `/api/utils/timezone` endpoint)
- ✅ Difficulty rating grid (Easy/Moderate/Hard/Expert)
- ✅ Experience rating grid (Amazing/Good/Tough/Epic)
- ✅ Trip notes field (expandable textarea)
- ✅ Integration: Wired into Profile tab header and Peak Detail "Your Logs" tab
- ✅ Form submission to `POST /api/peaks/summits/manual` endpoint
- ✅ Query invalidation on successful submission

**Login Prompt:**
- Modal for auth-gated actions
- Clear messaging about why auth is needed
- Quick login flow (Strava OAuth)
- Dismissible with graceful degradation

**User Settings Page:** ✅ **IMPLEMENTED**
- **Component:** `src/components/settings/SettingsScreen.tsx`
- **Route:** `app/settings.tsx` (modal presentation)
- **Profile Settings:** ✅ **IMPLEMENTED**
  - ✅ User avatar display (via `UserAvatar` component)
  - ✅ Display name display (read-only, from Strava)
  - ✅ Location display (city, state, country - read-only, from Strava)
  - ✅ Privacy settings (public/private profile toggle)
- **Account Settings:** ✅ **PARTIALLY IMPLEMENTED**
  - ⏳ Email preferences - **Pending**
  - ⏳ Notification settings - **Pending**
  - ⏳ Connected accounts (Strava) - **Pending**
  - ✅ Account deletion (with confirmation dialog)
- **App Settings:** ✅ **PARTIALLY IMPLEMENTED**
  - ⏳ Theme preference (light/dark/auto) - **Pending** (currently follows system)
  - ✅ Units (imperial/metric) - **IMPLEMENTED**
  - ⏳ Map preferences (default zoom, map style) - **Pending**
  - ⏳ Location permissions management - **Pending**
- **Data & Privacy:** ✅ **PARTIALLY IMPLEMENTED**
  - ⏳ Export user data - **Pending**
  - ✅ Privacy policy link - **IMPLEMENTED**
  - ✅ Terms of service link - **IMPLEMENTED**
  - ✅ Data deletion options (delete account) - **IMPLEMENTED**
- **About:** ✅ **IMPLEMENTED**
  - ✅ App version display
  - ⏳ Credits/attributions - **Pending**
  - ⏳ Support/contact information - **Pending**
- ✅ Navigation: Accessible from You tab header (gear icon) - **IMPLEMENTED**
- ✅ Consistent with app design system (CardFrame, topo patterns) - **IMPLEMENTED**
- ✅ Sign Out button with confirmation - **IMPLEMENTED**

### ⏳ Phase 4.5: Summit Review (Low-Confidence Summit Confirmation)

**Status:** ⏳ **PENDING** - Feature exists in web app, needs native implementation

**Overview:**
The backend automatically detects peak summits from Strava activities using a confidence scoring system. Summits with low confidence scores (`confidence_score < 0.45`) are marked as `unconfirmed` and require user review before being counted in stats and challenge progress.

**Confirmation Status Values:**
- `auto_confirmed` - High confidence (confidence_score >= 0.55), automatically accepted
- `unconfirmed` - Low confidence (confidence_score < 0.45), needs user review
- `user_confirmed` - User manually confirmed a low-confidence summit
- `denied` - User rejected a summit (kept for audit, excluded from all counts)

**Backend API Endpoints (Already Implemented):**
- `GET /api/peaks/summits/unconfirmed` - Fetch unconfirmed summits (optional `limit` query param)
- `POST /api/peaks/summits/:id/confirm` - Confirm a single summit
- `POST /api/peaks/summits/:id/deny` - Deny a single summit
- `POST /api/peaks/summits/confirm-all` - Bulk confirm all unconfirmed summits

**Data Structure (`UnconfirmedSummit` from `@pathquest/shared/types`):**
```typescript
interface UnconfirmedSummit {
  id: string;                    // Summit ID (activities_peaks.id)
  peakId: string;                // Peak OSM ID
  peakName: string;              // Peak name
  peakElevation: number;         // Peak elevation in meters
  activityId: string;             // Strava activity ID (for viewing activity)
  timestamp: string;             // Summit timestamp (ISO string)
  distanceFromPeak: number;      // Distance from peak in meters (currently 0 in backend)
  confidenceScore: number;       // Detection confidence score (0.0-1.0)
}
```

**Implementation Requirements:**

#### 1. Dashboard Card (`UnconfirmedSummitsCard`)

**Component:** `src/components/home/UnconfirmedSummitsCard.tsx`

**Purpose:** Show up to 3 unconfirmed summits on Home dashboard with quick confirm/deny actions.

**Features:**
- Amber-themed card (warning/attention styling)
- Shows count: "X summit(s) need review"
- List of up to 3 summits with:
  - Peak name + elevation
  - Time ago (e.g., "2 days ago")
  - Inline confirm (✓) and deny (✗) buttons
  - "View Activity" link (navigates to Activity Detail)
- "View all X in Profile" footer link (if more than 3)
- Optimistic updates (remove from list immediately on action)
- Loading states per summit during processing
- Auto-dismisses when all summits reviewed

**Styling:**
- Amber/rust accent color (`colors.secondary` or custom amber)
- Border: `border-amber-500/30`
- Background: `bg-amber-500/10`
- Confirm button: Green (`bg-green-500/20`, `text-green-400`)
- Deny button: Red (`bg-red-500/20`, `text-red-400`)

**Integration:**
- Add to `DashboardContent.tsx` below `TripReportCTA`
- Fetch via `useUnconfirmedSummits` hook (limit: 3)
- Query key: `["unconfirmedSummits", "dashboard"]`

#### 2. Profile Review Tab (`ReviewContent`)

**Component:** `src/components/profile/ReviewContent.tsx`

**Purpose:** Full-screen review interface showing all unconfirmed summits.

**Features:**
- Header with count: "X summit(s) to review"
- "Confirm All" button (bulk action)
- List of all unconfirmed summits with:
  - Peak name + elevation
  - Date formatted (e.g., "Dec 15, 2024")
  - Confidence score display (optional, for transparency)
  - Confirm (✓) and deny (✗) buttons
  - "View Activity" link
- Empty state: "All caught up! No summits need review right now."
- Refresh button at bottom
- Optimistic updates (remove from list immediately)
- Loading skeleton during initial fetch

**Styling:**
- Uses `CardFrame` for each summit card
- Consistent with other Profile tabs
- Amber accent for warning/attention theme

**Integration:**
- Add "Review" tab to Profile tab switcher (`ProfileContent.tsx`)
- Fetch via `useUnconfirmedSummits` hook (no limit)
- Query key: `["unconfirmedSummits", "all"]`
- Tab shows badge with count when unconfirmed summits exist

#### 3. Data Fetching Hook (`useUnconfirmedSummits`)

**Hook:** `src/hooks/useUnconfirmedSummits.ts`

**Purpose:** Fetch unconfirmed summits with TanStack Query.

**Implementation:**
```typescript
export function useUnconfirmedSummits(limit?: number) {
  const client = useApiClient();
  
  return useQuery({
    queryKey: ["unconfirmedSummits", limit ? "dashboard" : "all"],
    queryFn: async () => {
      // Need to add endpoint to shared package first
      return await endpoints.getUnconfirmedSummits(client, { limit });
    },
    enabled: !!client, // Only fetch when authenticated
    staleTime: 30000, // 30 seconds
  });
}
```

**Note:** Need to add `getUnconfirmedSummits` endpoint wrapper to `@pathquest/shared/api/endpoints/peaks.ts`

#### 4. Action Hooks (`useConfirmSummit`, `useDenySummit`, `useConfirmAllSummits`)

**Hooks:** `src/hooks/useSummitReview.ts`

**Purpose:** Mutations for confirming/denying summits with optimistic updates.

**Implementation:**
- Use TanStack Query `useMutation`
- Optimistic updates (remove from cache immediately)
- Invalidate related queries:
  - `["unconfirmedSummits"]`
  - `["dashboardStats"]`
  - `["recentSummits"]`
  - `["profileStats"]`
- Error handling with toast notifications

**Note:** Need to add endpoint wrappers to `@pathquest/shared/api/endpoints/peaks.ts`:
- `confirmSummit(client, { summitId })`
- `denySummit(client, { summitId })`
- `confirmAllSummits(client)`

#### 5. UI Components Needed

**New Components:**
- `UnconfirmedSummitsCard.tsx` - Dashboard card (similar to web app)
- `ReviewContent.tsx` - Profile Review tab content
- `UnconfirmedSummitRow.tsx` - Reusable row component for summit list items

**Shared Components (Reuse):**
- `CardFrame` - For summit cards
- `PrimaryCTA` / `SecondaryCTA` - For action buttons
- `EmptyState` - For empty state
- `Skeleton` - For loading states

#### 6. Navigation Updates

**Profile Tab:**
- Add "Review" tab to `ProfileContent` tab switcher
- Show badge with unconfirmed count on Review tab label
- Tab order: Stats, Peaks, Journal, Challenges, **Review**

**Activity Detail:**
- If viewing an activity with unconfirmed summits, show indicator
- Link from Review tab "View Activity" navigates to Activity Detail

#### 7. User Experience Flow

**Discovery:**
1. User sees amber card on Home dashboard: "3 summits need review"
2. Quick actions: Confirm/Deny inline, or "View all in Profile"

**Review:**
1. User taps "View all" or navigates to Profile → Review tab
2. Sees full list of unconfirmed summits
3. Can:
   - Confirm individual summits (✓)
   - Deny individual summits (✗)
   - "Confirm All" bulk action
   - View activity to verify GPS track
4. Summits disappear from list immediately (optimistic update)
5. Stats update automatically after confirmation

**Empty State:**
- When no unconfirmed summits: "All caught up! No summits need review right now."
- Dashboard card doesn't render when empty

#### 8. Implementation Checklist

**Backend (Shared Package):**
- [ ] Add `getUnconfirmedSummits` endpoint wrapper to `@pathquest/shared/api/endpoints/peaks.ts`
- [ ] Add `confirmSummit` endpoint wrapper
- [ ] Add `denySummit` endpoint wrapper
- [ ] Add `confirmAllSummits` endpoint wrapper
- [ ] Export `UnconfirmedSummit` type from shared types (already exists)

**Frontend (Native App):**
- [ ] Create `useUnconfirmedSummits` hook
- [ ] Create `useSummitReview` hooks (confirm, deny, confirmAll)
- [ ] Create `UnconfirmedSummitsCard` component
- [ ] Create `ReviewContent` component
- [ ] Create `UnconfirmedSummitRow` component (optional, for reusability)
- [ ] Add Review tab to Profile tab switcher
- [ ] Integrate dashboard card into `DashboardContent`
- [ ] Add badge count to Review tab label
- [ ] Add navigation from Review tab to Activity Detail
- [ ] Test optimistic updates and error handling
- [ ] Test empty states
- [ ] Test bulk "Confirm All" action

**Design Considerations:**
- Amber/rust color theme for warning/attention (matches web app)
- Clear, simple actions (confirm/deny buttons)
- "View Activity" link for verification context
- Optimistic updates for snappy UX
- Empty state messaging is encouraging ("All caught up!")

**Priority:** High - This is a core feature for data quality and user trust. Users need to review low-confidence detections to ensure accurate stats and challenge progress.

### ⏳ Phase 5: Polish + Offline (NEXT)

**Priority Order:**
1. **Login Prompt Modal** (quick win, improves UX for auth-gated actions)
   - Create `LoginPrompt.tsx` component
   - Show when user tries to favorite, add report, or log manual summit without auth
   - Clear messaging about why auth is needed
   - Quick login flow (Strava OAuth)
   - Dismissible with graceful degradation

2. **Onboarding Flow** (first-time user experience)
   - Welcome screens explaining key features
   - Location permission request with context
   - Strava connection prompt
   - Quick tutorial on core features (map, explore, logging)

3. **Offline Queue for Reports** (core functionality)
   - Queue trip reports and manual summits when offline
   - Store form data + photos locally (AsyncStorage/FileSystem)
   - Sync queue when connectivity restored
   - Show "pending upload" indicators

4. **TanStack Query Persistence** (performance)
   - Persist query cache to AsyncStorage
   - Restore cache on app launch
   - Reduce loading times for frequently accessed data

5. **Push Notification Setup** (engagement)
   - Expo Push Notifications integration
   - Register device tokens with backend
   - Notification preferences in Settings
   - Basic notifications (challenge progress, new reports on favorited peaks)

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

**Strava OAuth (Already Implemented):**
- Maintain existing Strava integration
- Allow account linking with other providers

**Provider Management:**
- Settings page: Show connected auth providers
- Ability to link/unlink providers
- Primary login method designation

**API Endpoints:**
- `POST /api/auth/google` - Google OAuth callback
- `POST /api/auth/apple` - Apple Sign-In callback
- `GET /api/auth/providers` - List user's connected auth providers
- `DELETE /api/auth/providers/:provider` - Unlink auth provider

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

**Email Verification:**
- Verify email on signup before account creation
- Resend verification email option (with rate limiting)
- Email change flow with re-verification

**Password Option (Future):**
- Optional password creation for email accounts
- Password reset flow
- Two-factor authentication (2FA) support

**API Endpoints:**
- `POST /api/auth/email/signup` - Email signup (sends verification)
- `POST /api/auth/email/magic-link` - Request magic link
- `POST /api/auth/email/verify-code` - Verify email code
- `GET /api/auth/email/verify-link` - Verify magic link (GET for email click)
- `POST /api/auth/email/resend` - Resend verification email

**Backend Requirements:**
- Email service integration (SendGrid or AWS SES)
- Magic link/code generation with cryptographic tokens
- Token storage with expiration (Redis or database)
- Rate limiting middleware

#### Phase 6.3: Fitness Device Integrations

**Supported Devices:**

- **Garmin Connect:**
  - OAuth integration with Garmin Connect API
  - Activity sync (runs, hikes, climbs)
  - Elevation gain and heart rate data
  - Sync: Manual trigger or automatic (webhook on new activity)

- **COROS:**
  - OAuth integration with COROS API
  - Activity sync (runs, hikes, climbs)
  - Elevation and performance metrics
  - Sync: Manual trigger or automatic

**Activity Import & Processing:**
- **Initial Backfill:** Import ALL available historical activities on first connect (this is the hook!)
- **Ongoing Sync:** New activities synced automatically or on manual trigger
- **Activity Filtering:** Filter by activity type (hike, run, climb, etc.)
- **GPS Track Processing:**
  - Fetch GPX/TCX data from device API
  - Pass GPS tracks through existing summit detection system
  - Detect multiple summits in single activity
  - Handle activities with no summit matches gracefully

**Summit Detection (Use Existing System):**
- Existing `checkForSummits` logic already handles GPS → peak matching
- No changes needed to detection algorithm
- Just need to feed imported GPS tracks into existing pipeline

**Manual Review & Confirmation:**
- Show detected summits to user for confirmation
- Allow user to add/remove summits from activity
- Add notes and conditions to auto-detected summits
- Batch confirmation for multiple activities

**Activity Display:**
- Show imported activities in user's journal
- Link activities to detected summits
- Display activity stats (distance, elevation, time)
- Show activity map with GPS track
- Deep link to original activity in Garmin/COROS app

**Settings & Management:**
- **Connected Devices Screen:**
  - List connected devices with last sync time
  - Connect/disconnect device accounts
  - Manual sync button per device
  - Sync progress indicator
- **Privacy:**
  - Clear data sharing explanation
  - Ability to revoke device access
  - Delete imported activities option

**API Endpoints:**
- `POST /api/devices/garmin/connect` - Initiate Garmin OAuth
- `GET /api/devices/garmin/callback` - Garmin OAuth callback
- `POST /api/devices/coros/connect` - Initiate COROS OAuth
- `GET /api/devices/coros/callback` - COROS OAuth callback
- `GET /api/devices` - List connected devices
- `DELETE /api/devices/:id` - Disconnect device
- `POST /api/devices/:id/sync` - Trigger manual sync
- `GET /api/activities/imported` - List imported activities (paginated)
- `GET /api/activities/:id` - Get activity details with GPS track
- `POST /api/activities/:id/confirm-summits` - Confirm/edit detected summits
- `DELETE /api/activities/:id` - Delete imported activity

**Backend Implementation:**
- Background job queue (Bull/BullMQ) for activity processing
- Garmin/COROS API clients with token refresh
- GPS track parsing (GPX/TCX/FIT formats)
- Activity storage in database with GPS track in S3/blob storage
- Webhook endpoints for real-time sync (if device APIs support)

**Frontend Components:**
- `ConnectedDevicesScreen.tsx` - Device management
- `ActivityImportScreen.tsx` - Review imported activities
- `ActivityDetailScreen.tsx` - Single activity with map
- `SummitConfirmationModal.tsx` - Confirm detected summits

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
- **Database Schema:**
  - `subscriptions` table: `user_id`, `status` (enum: 'active', 'canceled', 'expired', 'trial'), `starts_at`, `ends_at`, `trial_ends_at`, `stripe_subscription_id`, `stripe_customer_id`
  - `alert_preferences` table: `user_id`, `alert_methods` (JSON: {push: bool, email: bool, in_app: bool}), `alert_frequency` (enum: 'immediate', 'daily_digest')
- **API Endpoints:**
  - `GET /api/subscription/status` - Check user's subscription status
  - `POST /api/subscription/checkout` - Create Stripe Checkout session
  - `POST /api/subscription/cancel` - Cancel subscription
  - `POST /api/subscription/webhook` - Stripe webhook handler
  - `GET /api/subscription/portal` - Get Stripe Customer Portal URL
- **Middleware:**
  - `requirePremium` middleware for premium-only endpoints
  - Check subscription status on relevant routes

**Frontend Components:**
- `PremiumBadge.tsx` - Badge showing premium status
- `PremiumUpgradeModal.tsx` - Upgrade prompt modal with feature list
- `SubscriptionManagementScreen.tsx` - Manage subscription (in Settings)
- `useSubscription.ts` hook - Check subscription status, manage upgrade flow
- Update `authStore` to include subscription state (`isPremium`, `subscriptionStatus`, `trialEndsAt`)

**Stripe Integration:**
- Stripe Checkout for payment processing (web-based, opens in browser)
- Stripe Customer Portal for subscription management
- Webhook handling for subscription lifecycle events
- Handle subscription lapse gracefully (features disabled, data retained)

**What Happens on Lapse:**
- Premium features disabled immediately
- All user data retained (summits, favorites, etc.)
- Offline maps remain downloaded but can't download new ones
- Clear messaging: "Your premium subscription has ended. Upgrade to restore features."

#### Phase 7.2: Proactive Weather Alerts

**Alert System (Simplified):**
- **Alert Source:** Official weather service alerts only (no custom thresholds)
  - NWS (National Weather Service) alerts for US locations
  - Open-Meteo weather alerts for international
- **What Triggers Alerts:**
  - Active weather advisories/warnings for favorited peak locations
  - Examples: Winter storm warning, high wind advisory, flash flood watch
- **Uses existing favorites system** - Alerts only sent for favorited peaks/lands

**Backend Implementation:**
- **Alert Service** (`src/services/alertService.ts`):
  - Background job runs hourly
  - For each premium user with favorited peaks:
    1. Get all favorited peaks/lands with coordinates
    2. Check NWS/Open-Meteo for active alerts at those coordinates
    3. Generate app alerts for any active weather alerts
    4. Queue for delivery (push, email, in-app)
  - **Deduplication:** Don't re-alert same weather event for 24 hours
  - **Batching:** Group multiple alerts in same region into single notification
- **Alert Queue:**
  - Use Bull/BullMQ job queue
  - Rate limiting to prevent notification spam
- **Alert Storage:**
  - `alerts` table: `user_id`, `peak_id` (or `land_id`), `alert_type`, `nws_event_id`, `title`, `message`, `severity`, `triggered_at`, `read_at`, `dismissed_at`, `expires_at`, `metadata` (JSON)

**Push Notification Infrastructure (Expo Push):**
- **Setup:**
  - Use `expo-notifications` package
  - Register for push token on app startup (after permission granted)
  - Store push tokens in `user_push_tokens` table: `user_id`, `token`, `platform`, `created_at`
- **Sending:**
  - Use Expo Push API (`https://exp.host/--/api/v2/push/send`)
  - Batch notifications (up to 100 per request)
  - Handle delivery receipts and failed tokens
- **Notification Channels (Android):**
  - `weather-alerts` - Weather warnings and advisories
  - `park-alerts` - Closures and park information
- **Deep Linking:**
  - Tap notification → open peak/land detail page
  - Use Expo Linking for deep link handling

**API Endpoints:**
- `GET /api/alerts` - Get user's alerts (paginated)
- `PUT /api/alerts/:id/read` - Mark alert as read
- `PUT /api/alerts/:id/dismiss` - Dismiss alert
- `DELETE /api/alerts/all` - Clear all alerts
- `POST /api/push-tokens` - Register push token
- `DELETE /api/push-tokens/:token` - Unregister push token

**Frontend Implementation:**
- **Components:**
  - `AlertListScreen.tsx` - List of all alerts
  - `AlertCard.tsx` - Individual alert with severity color coding
  - `AlertPreferencesScreen.tsx` - Configure delivery methods (push/email/in-app)
  - `AlertBadge.tsx` - Unread count badge
- **UI Integration:**
  - Bell icon in header (all tabs)
  - Badge showing unread count
  - Alert preferences in Settings > Premium

#### Phase 7.3: Map Overlays

**Weather Overlay:**
- **Data Source:** Open-Meteo API (works globally, already in use)
  - Gridded weather data for current conditions
  - Can also use weather.gov WMS tiles for US (pre-rendered)
- **Implementation:**
  - Add overlay toggle in `MapView.tsx`
  - Fetch weather grid data for current map bounds
  - Render as semi-transparent colored overlay
    - Temperature: Heat map (blue → green → yellow → red)
    - Precipitation: Blue gradient
  - Update overlay as map moves/zooms (debounced)
- **UI:**
  - Overlay toggle button in map controls
  - Legend panel showing color scale
  - Time selector (current, +6h, +12h, +24h forecast)

**Snow Pack Overlay:**
- **Data Source:** SNODAS (Snow Data Assimilation System) from NOAA
  - Gridded data at 1km resolution (much better than sparse SNOTEL stations!)
  - Daily snow depth and SWE (Snow Water Equivalent) estimates
  - Continental US coverage
  - Data URL: `https://nohrsc.noaa.gov/snow_model/`
- **International:** Open-Meteo provides snow depth data globally
- **Implementation:**
  - Fetch SNODAS grid tiles for map bounds (or Open-Meteo for non-US)
  - Render as colored overlay:
    - Color scale: White (no snow) → Light blue → Deep blue (deep snow)
    - Contour lines for depth thresholds (optional)
  - Update overlay as map moves/zooms
- **UI:**
  - Overlay toggle in map controls
  - Legend showing snow depth scale
  - Date selector (current + last 7 days)

**Park Alerts/Closures Overlay:**
- **Data Sources (NEEDS MORE RESEARCH):**
  - **NPS**: National Park Service API (`https://developer.nps.gov/api/v1/alerts`) ✅ Confirmed available
  - **USFS**: US Forest Service - Need to research API availability
  - **BLM**: Bureau of Land Management - Need to research API availability
  - **State Parks**: Varies by state - Need to research
  - **Recreation.gov**: May have consolidated closure data
- **TODO:** Research and document available APIs for each agency
- **Implementation:**
  - Fetch alerts/closures for current map bounds
  - Render as colored polygons/markers:
    - Red: Closures
    - Yellow: Warnings/Cautions
    - Blue: Information
  - Tap on alert to show details popup
- **UI:**
  - Overlay toggle in map controls
  - Alert markers on map
  - Alert detail popup when marker clicked
  - Filter by alert type

#### Phase 7.4: Offline Maps

**Implementation:**
- **Map Tile Downloads:**
  - Use Mapbox Offline API or tile download approach
  - Allow user to select region on map and zoom levels
  - Download tiles to device storage
  - Show download progress and storage used
- **Storage Management:**
  - Show total storage used by offline maps
  - Delete individual regions
  - Automatic cleanup of expired tiles
- **Offline Mode:**
  - Detect when offline
  - Use downloaded tiles instead of network
  - Show "Offline" indicator
  - Peak/challenge data cached via TanStack Query persistence

**UI:**
- `OfflineMapsScreen.tsx` - Manage downloaded regions
- `DownloadRegionModal.tsx` - Select region and zoom levels
- Download button on map for current view
- Storage usage display in Settings

#### Phase 7.5: Extended Forecasts & Trailhead Navigation

**Extended Forecasts (14-day):**
- Extend current 7-day forecast to 14 days
- Use Open-Meteo extended forecast endpoint
- Show in peak detail view (premium badge on days 8-14)

**Trailhead/Road-to-Peak Navigation:**
- **Data Source:** Need to research (OpenStreetMap trails? Hiking Project API? AllTrails?)
- **Features:**
  - Show nearest trailhead to peak
  - Driving directions to trailhead (link to Google Maps/Apple Maps)
  - Trail route from trailhead to peak (if data available)
  - Estimated hiking time/distance
- **TODO:** Research trail data sources and feasibility

**Map Overlay System:**
- **Component Architecture:**
  - `MapOverlayControls.tsx` - Toggle buttons for each overlay
  - `WeatherOverlay.tsx` - Weather data rendering
  - `SnowPackOverlay.tsx` - Snow pack data rendering
  - `ParkAlertsOverlay.tsx` - Park alerts rendering
  - `OverlayLegend.tsx` - Legend component for each overlay
- **State Management:**
  - Add to `mapStore`:
    - `activeOverlays: string[]` (array of overlay IDs)
    - `overlayOpacity: number` (0-1)
    - `overlayTime: Date` (for time-based overlays)
- **Performance:**
  - Cache overlay data (15-30 minute TTL for weather, 24h for snow)
  - Debounce map movement for overlay updates
  - Lazy load overlay data (only fetch when overlay enabled)
  - Consider pre-rendered WMS tiles where available

**Premium Gating:**
- Show lock icon on premium features for free users
- Tap locked feature → show `PremiumUpgradeModal`
- Check `isPremium` before enabling:
  - Weather alerts configuration
  - Map overlay toggles
  - Offline map downloads
  - Days 8-14 of forecast
  - Trailhead navigation

**Settings Integration:**
- Settings > Premium Section:
  - Subscription status and renewal date
  - Manage subscription (opens Stripe Portal)
  - Alert delivery preferences (push/email/in-app)
  - Offline maps management

**Implementation Files:**

**Backend (`pathquest-api/`):**
- `src/routes/subscription.ts` - Subscription endpoints
- `src/routes/alerts.ts` - Alert endpoints
- `src/routes/push-tokens.ts` - Push token management
- `src/services/alertService.ts` - Alert generation service
- `src/services/nwsService.ts` - NWS weather alerts API
- `src/services/snodasService.ts` - SNODAS snow data API
- `src/services/parkAlertsService.ts` - Park alerts API integration
- `src/jobs/alertProcessor.ts` - Hourly alert check job
- `src/jobs/pushNotificationSender.ts` - Push notification delivery
- `src/middleware/requirePremium.ts` - Premium gating middleware
- Database migrations for `subscriptions`, `alert_preferences`, `alerts`, `user_push_tokens` tables

**Frontend (`pathquest-native/pathquest/`):**
- `src/components/premium/PremiumBadge.tsx`
- `src/components/premium/PremiumUpgradeModal.tsx`
- `src/components/premium/SubscriptionManagementScreen.tsx`
- `src/components/alerts/AlertListScreen.tsx`
- `src/components/alerts/AlertCard.tsx`
- `src/components/alerts/AlertPreferencesScreen.tsx`
- `src/components/map/MapOverlayControls.tsx`
- `src/components/map/WeatherOverlay.tsx`
- `src/components/map/SnowPackOverlay.tsx`
- `src/components/map/ParkAlertsOverlay.tsx`
- `src/components/map/OverlayLegend.tsx`
- `src/components/offline/OfflineMapsScreen.tsx`
- `src/components/offline/DownloadRegionModal.tsx`
- `src/hooks/useSubscription.ts`
- `src/hooks/useAlerts.ts`
- `src/hooks/useAlertPreferences.ts`
- `src/hooks/useOfflineMaps.ts`
- `src/lib/subscription/stripe.ts` - Stripe Checkout/Portal integration
- `src/lib/notifications/expo-push.ts` - Push notification setup
- Update `src/store/authStore.ts` to include subscription state
- Update `src/store/mapStore.ts` to include overlay state

**Considerations:**
- **Rate Limiting**: Weather and park APIs may have rate limits - implement caching
- **International Support**: Open-Meteo works globally; SNODAS is US-only (use Open-Meteo snow for international)
- **Performance**: Map overlays can be heavy - use debouncing, lazy loading, and tile caching
- **Offline Storage**: Monitor device storage usage, provide cleanup tools
- **Testing**: Test alert system with various weather scenarios; test offline mode thoroughly
- **Privacy**: Only check weather for favorited locations, not browsing history

**Research TODOs:**
- [ ] USFS API for forest closures/alerts
- [ ] BLM API for land closures/alerts
- [ ] State parks APIs (may need per-state research)
- [ ] Trail data sources for trailhead navigation (OSM, Hiking Project, etc.)
- [ ] Mapbox offline map storage limits and pricing

---

#### Phase 8: Route Planning & Multi-Peak Routes

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
- Time estimation using modified Naismith's rule:
  - Base speed: 1.5 mph (off-trail)
  - Elevation penalty: +1 hour per 1500ft gain
  - Altitude penalty: +10-30% above 10,000ft
- Shows difficulty note based on slope/elevation

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
- Uses Valhalla routing engine (same as trailhead routes)

**7. Offline Route Navigation**
- Download routes for offline use
- **Route data**: ~20KB per route (polyline, elevation profile, metadata)
- **Map tiles**: ~50-100MB per route area (shared if routes overlap)
- **Fully offline capabilities**:
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

**UI Components:**

**Route Planning Screen:**
- Map view with route overlay
- Route stats card (distance, elevation, time)
- Elevation profile chart
- Trail segment + off-trail segment breakdown
- "Add Another Peak" button
- "Save Route" button
- Drive directions button

**Route Builder (Multi-Peak):**
- Peak list (drag to reorder)
- Route type selector (loop/out-and-back/point-to-point)
- Route stats (total distance, elevation, time)
- Map preview with full route polyline
- "Optimize Order" button

**Saved Routes List:**
- User's saved routes
- Filter by peak/challenge
- Link to map view
- Share/delete options
- "Download for Offline" button per route

**Offline Route Navigation Screen:**
- Map view with downloaded route overlay
- Current GPS location indicator
- Route stats card showing:
  - Current position on route (or distance from route if off-route)
  - Remaining distance to peak(s)
  - Remaining elevation to peak(s)
  - Bearing to route (if off-route)
- Elevation profile with current position marker
- "Recalculate Route" button (requires network)
- Works fully offline once route is downloaded

**Offline Routes Management:**
- List of downloaded routes
- Storage usage per route
- Total offline storage used
- Delete route option (removes route data + map tiles)
- Download progress indicator

**Implementation Files:**

**Backend (`pathquest-api/`):**
- `src/routes/routes.ts` - Route endpoints
- `src/helpers/routes/findTrailheads.ts` - OSM trailhead finder
- `src/helpers/routes/generateRoute.ts` - Single peak route generation
- `src/helpers/routes/generateMultiPeakRoute.ts` - Multi-peak routing
- `src/helpers/routes/calculateOffTrail.ts` - Off-trail segment calculation
- `src/helpers/routes/saveRoute.ts` - Route saving
- `src/helpers/routes/findNearbyPeaks.ts` - Nearby peaks for extension
- `src/clients/valhalla.ts` - Valhalla API client
- `src/jobs/precomputeRoutes.ts` - Background job for challenge routes
- Database migrations for `routes`, `route_segments`, `precomputed_routes` tables

**Routing Service (`pathquest-valhalla/`):**
- Containerized Valhalla instance
- Weekly tile build pipeline
- Cloud Run deployment (8GB, 2 CPU, min=1)

**Frontend (`pathquest-native/pathquest/`):**
- `src/components/routes/RoutePlanningScreen.tsx`
- `src/components/routes/RouteBuilder.tsx`
- `src/components/routes/RouteStatsCard.tsx`
- `src/components/routes/ElevationProfile.tsx`
- `src/components/routes/SavedRoutesList.tsx`
- `src/components/routes/RouteSegmentBreakdown.tsx`
- `src/components/routes/OfflineRouteNavigation.tsx` - Offline navigation screen
- `src/components/routes/OfflineRoutesManager.tsx` - Download/delete offline routes
- `src/hooks/useRoute.ts`
- `src/hooks/useSavedRoutes.ts`
- `src/hooks/useOfflineRoutes.ts` - Offline route management
- `src/utils/routeSnapping.ts` - Snap GPS to route (offline math)
- `src/utils/routeCalculations.ts` - Remaining distance/elevation (offline math)
- `src/services/offlineStorage.ts` - SQLite/AsyncStorage for offline routes

**Frontend (`pathquest-frontend/`):**
- Similar components for web interface
- Map integration with route overlays

**Offline Route Data Structure:**
Routes downloaded for offline use include:
- Decoded polyline coordinates (for snapping calculations)
- Pre-calculated elevation profile at each point
- Pre-calculated cumulative distances at each point
- Segment metadata (start/end indices, peak associations)
- Off-trail segment data (coordinates, distance, bearing)
- Map tile region bounds (for Mapbox offline download)

**Offline Calculations:**
All calculations run on-device using pre-downloaded route data (no network required):
- **Snap GPS to route**: Find closest point on polyline using haversine distance
- **Remaining distance**: Sum cumulative distances from snap point to segment end + off-trail
- **Remaining elevation**: Sum positive elevation changes from snap point to peak
- **Distance from route**: If user is off-route, calculate distance and bearing to nearest point

**Storage Management:**
- Route data: ~20KB per route (stored in SQLite/AsyncStorage)
- Map tiles: ~50-100MB per route area (Mapbox offline regions)
- 10 routes (same region): ~100-150MB (tiles shared)
- 10 routes (different regions): ~500MB-1GB
- UI shows storage usage, allows per-route deletion

**Considerations:**
- **Valhalla Setup**: Requires weekly tile builds, ~8GB container image
- **Off-Trail Accuracy**: ±30% time estimate (acceptable for short segments)
- **Multi-Peak Performance**: Cache segments, only recompute affected parts
- **Pre-computation**: Run weekly, process challenge peaks in batches
- **Offline Storage**: Monitor device storage, provide cleanup tools
- **GPS Accuracy**: Offline navigation depends on GPS accuracy (typically 3-10m)
- **No Activity Tracking**: This is navigation display only, not recording activity
- **Cost**: ~$90-110/month for Valhalla service (Cloud Run)

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

