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
| 7 | Add Report Modal | No | Yes | Hero card CTA, Peak Detail |
| 8 | Manual Summit Entry | No | Yes | You tab action |
| 9 | Home - Dashboard | No | Yes | Home tab |
| 10 | You - List Mode | No | Yes | You tab (default) |
| 11 | You - Map Mode | Yes | Yes | Toggle from list mode |
| 12 | Login Prompt | No | N/A | Any auth-gated action |
| 13 | Settings | No | Yes | You tab header |
| 14 | Onboarding | No | No | First launch only |

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

#### Community Tab
```
┌─────────────────────────────────────────────┐
│  42 people have summited this peak          │
├─────────────────────────────────────────────┤
│  [Recent]  [Top Rated]  [Photos]            │
├─────────────────────────────────────────────┤
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

### 7. Add Report Modal

Camera-first, minimal-friction trip report entry.

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
- Photo area: tap opens camera directly (not file picker)
- Condition tags: multi-select
- Difficulty: single-select
- Experience: single-select
- Notes: collapsed by default, tap to expand
- Offline: queues submission, syncs when online

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
        DiscoverySheet.tsx        ✅ Bottom sheet with peak/challenge list
        DiscoveryList.tsx         ✅ List of nearby peaks or challenges
        FloatingPeakCard.tsx      ✅ Peak card overlay on map (with animations)
        FloatingChallengeCard.tsx ✅ Challenge card overlay on map (with progress)
        PeakRow.tsx               ✅ Peak list item
        ChallengeRow.tsx          ✅ Challenge list item
        PeakDetail/
          index.tsx               ⬜ Main screen with collapsible hero
          HeroCard.tsx            ⬜ Animated collapsible header
          ConditionsTab.tsx       ⬜ Weather + recent conditions
          CommunityTab.tsx        ⬜ Public summit reports
          YourLogsTab.tsx         ⬜ User's summits + add report
        ChallengeDetail/
          index.tsx               ⬜ Main screen with progress
          HeroCard.tsx            ⬜ Animated collapsible header
          ProgressTab.tsx         ⬜ User's progress + milestones
          PeaksTab.tsx            ⬜ All peaks in challenge
        CompassView.tsx           ⬜ Full-screen compass navigation
      
      map/
        MapView.tsx               ✅ Full-screen Mapbox wrapper
        PeakMarkers.tsx           ✅ Peak markers layer (GeoJSON)
        ChallengeOverlay.tsx      ⬜ Challenge peak markers with progress
        LocationPuck.tsx          ✅ User location indicator (always visible)
        CenterOnMeButton.tsx      ✅ FAB to recenter on user location
        LineToTarget.tsx          ✅ Line from user to selected peak
      
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
        ProfileMapView.tsx        ⬜ Map of user's peaks (map mode toggle pending)
      
      modals/
        AddReportModal.tsx        ⬜ Trip report entry
        ManualSummitModal.tsx     ⬜ Manual summit logging
        LoginPrompt.tsx           ⬜ Auth prompt modal
      
      ui/ (Design System Primitives)
        CardFrame.tsx             ✅ Reusable card wrapper (topo/ridge variants)
        PrimaryCTA.tsx            ✅ Primary action button (bevel, shadows)
        SecondaryCTA.tsx          ✅ Secondary action button
        TopoPattern.tsx           ✅ SVG contour line patterns
        MountainRidge.tsx         ✅ SVG mountain silhouette
        Text.tsx                  ✅ Typography component (Fraunces serif)
        Value.tsx                 ✅ Data display component (IBM Plex Mono)
      
      shared/
        GPSStrip.tsx              ⬜ Distance/bearing/vert display
        ConditionTags.tsx         ⬜ Selectable condition chips
        DifficultyPicker.tsx      ⬜ Difficulty selection
        ExperiencePicker.tsx      ⬜ Experience rating selection
        PhotoCapture.tsx          ⬜ Camera-first photo input
        SummitReportCard.tsx      ⬜ Summit report display
        ProgressBar.tsx           ⏳ Challenge progress bar (used in FavoriteChallenges)
        CollapsibleHeader.tsx     ⬜ Reanimated scroll header
    
    store/
      mapStore.ts                 ✅ Map state (bounds, zoom, selection mode)
      sheetStore.ts               ✅ Sheet snap state
      locationStore.ts            ⬜ User location + permissions (using Mapbox directly)
      selectionStore.ts           ✅ Selected peak/challenge (integrated into mapStore)
      authStore.ts                ✅ Auth state
    
    hooks/
      useLocation.ts              ✅ GPS location hook (Mapbox locationManager)
      useMapData.ts               ✅ Fetch peaks/challenges for map bounds
      useDashboardData.ts         ✅ Dashboard data (stats, recent summits, challenges)
      useSuggestedPeak.ts         ✅ Suggested peak with weather
      useCompass.ts               ⬜ Magnetometer heading hook
      useBearing.ts               ⬜ Calculate bearing to target
      useCollapsibleHeader.ts     ⬜ Scroll-based header animation
      useOfflineQueue.ts          ⬜ Queue actions for offline sync
    
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
| `/api/users/:id/summits` | GET | You - Peaks tab | ✅ |
| `/api/users/:id/challenges` | GET | You - Challenges tab | ✅ |
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
- ✅ Phase 3: Home Dashboard (partial - You tab map mode pending)
- ✅ Visual Design System (all primitives and theme)
- ✅ Icon migration (FontAwesome → Lucide icons)
- ✅ Typography system (Text/Value components)
- ✅ Real API integration (dashboard, map data, suggested peak)
- ✅ Location services (Mapbox locationManager integration)

**In Progress:**
- ⏳ Phase 3: You tab map mode toggle

**Pending:**
- ⏳ Phase 2: Peak Detail + GPS
- ⏳ Phase 3.5: Photo Infrastructure (Backend)
- ⏳ Phase 4: Actions + Modals
- ⏳ Phase 5: Polish + Offline

---

### ✅ Phase 1: Core Navigation + Explore (COMPLETED)
- ✅ 3-tab navigation shell (Home, Explore, You)
- ✅ Explore tab with map + discovery sheet
- ✅ Peak floating card (`FloatingPeakCard` with animations)
- ✅ Challenge floating card (`FloatingChallengeCard` with progress)
- ✅ Basic Peak Detail (no sub-tabs yet)
- ✅ Location puck on map (always visible)
- ✅ CenterOnMeButton FAB
- ✅ LineToTarget component (dashed line to selected peak)
- ✅ Selection mode state management (none/floating/detail)
- ✅ Real data fetching from API (peaks/challenges for map bounds)
- ✅ Map data refresh on camera movement

### Phase 2: Peak Detail + GPS
- Collapsible hero with GPS strip (distance/bearing/elevation gain)
- All three sub-tabs (Conditions, Community, Your Logs)
- Compass View (full-screen navigation to peak)
- Location permission flow (integrated with Mapbox)

**UI Conversion Required:**
- Convert Peak Detail screen to use `CardFrame` for hero card and content sections
- Apply `TopoPattern` (corner variant) to hero card
- Use `PrimaryCTA`/`SecondaryCTA` for action buttons (View on Map, Add Report, etc.)
- Replace hardcoded colors with theme colors via `useTheme()` hook
- Use `<Text>` component for all labels and `<Value>` for elevations/distances
- Apply mountain ridge silhouette to hero card (`ridge="bottom"`)
- Ensure proper shadow hierarchy (hero card should use `variant="hero"`)

**Data Fetching:**
- Implement hooks for peak detail data (`usePeakDetail`, `usePeakConditions`, `usePeakCommunity`, `usePeakUserLogs`)
- Wire up API endpoints: `/api/peaks/:id`, `/api/peaks/:id/summits`, `/api/weather/current`
- Add loading and error states to all sub-tabs

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

**You Tab (PARTIAL):**
- ✅ Profile screens with sub-tabs (Stats, Peaks, Journal, Challenges)
- ✅ Basic list mode
- ⏳ Map mode toggle (not yet implemented)
- ⏳ Enhanced journal entries

**You Tab - Critical Issues to Fix:**
1. **Data Fetching Not Implemented:**
   - `ProfileContent` is currently passing hardcoded empty data (`stats={undefined}`, `peaks={[]}`, `entries={[]}`, `challenges={[]}`)
   - Need to create `useProfileData` hook (similar to `useDashboardData`) that fetches:
     - User stats: `/api/users/:id/stats`
     - User peaks: `/api/users/:id/summits`
     - User journal entries: `/api/users/:id/journal` (or derive from summits with reports)
     - User challenges: `/api/users/:id/challenges`
   - Wire up data fetching in `app/(tabs)/_layout.tsx` where `ProfileContent` is rendered
   - Pass real data props to `ProfileContent` instead of empty arrays/undefined

2. **UI Conversion Required:**
   - Convert all profile sub-tabs to use `CardFrame` for stat cards and list items
   - Apply `TopoPattern` (corner variant) to stat cards
   - Use `PrimaryCTA`/`SecondaryCTA` for action buttons (View Peak, Add Entry, etc.)
   - Replace hardcoded colors with theme colors via `useTheme()` hook
   - Use `<Text>` component for all labels and `<Value>` for numbers/stats
   - Apply consistent spacing and card styling (match dashboard aesthetic)
   - Ensure proper shadow hierarchy for interactive elements

**Debugging Steps for You Tab Data:**
1. Check if `user?.id` is available when rendering `ProfileContent`
2. Verify API endpoints are returning data (check network tab/logs)
3. Create `useProfileData` hook using TanStack Query (similar to `useDashboardData`)
4. Add loading and error states to `ProfileContent` and sub-tabs
5. Test with authenticated user who has summits/challenges

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
- ✅ All CTAs use `PrimaryCTA`/`SecondaryCTA` components
- ✅ Theme colors applied throughout dashboard

### Phase 3.5: Photo Infrastructure (Backend)
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

### Phase 4: Actions + Modals
- Add Report modal with camera
- Photo capture + upload flow
- Manual Summit entry
- Login prompt (for auth-gated actions)
- Settings screen

### Phase 5: Polish + Offline
- Offline queue for reports + photos
- TanStack Query persistence
- Onboarding flow
- Push notification setup

