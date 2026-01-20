# PathQuest Logo Usage Guide

## Logo Component Location
`src/components/brand/Logo.tsx`

## ✅ Already Updated (Brand Elements)

### 1. GuestWelcomeHero (`src/components/home/GuestWelcomeHero.tsx`)
- **Location**: Hero section for guest users
- **Usage**: Main brand display with "PathQuest" text
- **Status**: ✅ Updated - Replaced `<Mountain>` icon with `<Logo>`

## 🎯 Potential Brand Usage Areas

### 2. OnboardingModal (`src/components/onboarding/OnboardingModal.tsx`)
- **Current**: Uses `Mountain` icon in first slide
- **Suggestion**: Could replace the icon in the "Welcome" slide with Logo for brand consistency
- **Note**: Other slides use functional icons (MapPin, Clock) - keep those as-is

### 3. LoginPrompt (`src/components/modals/LoginPrompt.tsx`)
- **Current**: Uses `Mountain` icon for generic/login contexts
- **Suggestion**: Could add Logo above the modal content as a brand element
- **Note**: Context-specific icons (Star, Trophy, etc.) should remain functional

### 4. Settings Screen (`src/components/settings/SettingsScreen.tsx`)
- **Current**: No brand element visible
- **Suggestion**: Could add Logo in header or "About PathQuest" section

### 5. App Splash/Launch Screen
- **Current**: Uses Expo default
- **Suggestion**: Add Logo to splash screen (configure in `app.json` or `app.config.ts`)

### 6. Empty States
- **Current**: Various empty states use generic icons
- **Suggestion**: Consider Logo for "No data" states as a subtle brand reminder

## 📝 Functional Icons (Keep as Mountain)

These use `Mountain` icon functionally (not as brand) - **DO NOT** replace:
- Peak counts/badges (e.g., "12 peaks" in challenge cards)
- Summit indicators in activity lists
- Peak-related UI elements (not brand elements)

## Usage Example

```tsx
import { Logo } from '@/src/components/brand';

// Basic usage
<Logo size={32} />

// With custom color
<Logo size={24} color="#4A7C59" />

// In a container
<View style={{ backgroundColor: `${colors.primary}20`, padding: 12, borderRadius: 12 }}>
  <Logo size={24} />
</View>
```

## Brand Guidelines

- **Use Logo for**: Brand identity, app headers, welcome screens, onboarding
- **Use Mountain icon for**: Functional peak-related UI (counts, indicators, lists)
- **Size recommendations**: 
  - Small: 16-20px (inline with text)
  - Medium: 24-32px (cards, headers)
  - Large: 48-64px (hero sections, splash screens)

