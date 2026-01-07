/**
 * Map Store
 * 
 * Manages the state of the map including:
 * - Map focus (what overlay/context is being displayed)
 * - Visible peaks and challenges in the current viewport
 * - Selection state for floating cards
 * - Map interaction state (zoomed out too far, satellite mode, etc.)
 */

import { create } from 'zustand';
import type { Peak, ChallengeProgress } from '@pathquest/shared';

// Minimum zoom level for searching peaks/challenges
const MIN_SEARCH_ZOOM = 7;

// Selection mode determines how the selected item is displayed
export type SelectionMode = 'none' | 'floating' | 'detail';

// Padding type for fitBounds (matches MapView)
export type FitBoundsPadding = number | {
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
};

// ============================================================================
// MAP FOCUS - Single source of truth for what the map is displaying
// ============================================================================

// Discovery mode: normal map, no overlay
interface DiscoveryFocus {
  type: 'discovery';
}

// Challenge focus: showing challenge peaks with summit status
interface ChallengeFocus {
  type: 'challenge';
  challengeId: string;
  peaks: Array<Peak & { is_summited?: boolean }>;
}

// User focus: showing a user's summited peaks
interface UserFocus {
  type: 'user';
  userId: string;
  peaks: Peak[];
}

// Peak focus: zoomed to a specific peak, optionally with parent context
interface PeakFocus {
  type: 'peak';
  peakId: string;
  coords: [number, number];
  // Parent context is preserved when drilling down from challenge/user
  parentFocus?: ChallengeFocus | UserFocus;
}

export type MapFocus = DiscoveryFocus | ChallengeFocus | UserFocus | PeakFocus;

// Helper to get overlay peaks from focus
export function getOverlayPeaksFromFocus(focus: MapFocus): Array<Peak & { is_summited?: boolean }> | null {
  switch (focus.type) {
    case 'challenge':
      return focus.peaks;
    case 'user':
      return focus.peaks;
    case 'peak':
      // When drilling down, show parent context's peaks
      return focus.parentFocus?.peaks ?? null;
    case 'discovery':
    default:
      return null;
  }
}

// Helper to get recenter target from focus
export function getRecenterTarget(focus: MapFocus): 
  | { type: 'bounds'; peaks: Peak[] }
  | { type: 'point'; coords: [number, number] }
  | null {
  switch (focus.type) {
    case 'peak':
      // Always recenter to peak coords when viewing peak
      return { type: 'point', coords: focus.coords };
    case 'challenge':
      return { type: 'bounds', peaks: focus.peaks };
    case 'user':
      return { type: 'bounds', peaks: focus.peaks };
    case 'discovery':
    default:
      return null;
  }
}

// ============================================================================
// STORE STATE
// ============================================================================

interface MapState {
  // The current map focus (single source of truth for overlays)
  mapFocus: MapFocus;
  
  // Visible items in current viewport (for discovery mode)
  visiblePeaks: Peak[];
  visibleChallenges: ChallengeProgress[];
  
  // Selection state (for floating cards, independent of focus)
  selectedPeakId: string | null;
  selectedChallengeId: string | null;
  selectionMode: SelectionMode;
  
  // Map state
  isZoomedOutTooFar: boolean;
  isSatellite: boolean;
  currentZoom: number;
  currentCenter: [number, number] | null;
  currentBounds: [[number, number], [number, number]] | null;
  
  // Initial location ready flag (prevents querying Boulder before user location is found)
  isInitialLocationReady: boolean;
  
  // Hover state (for highlighting peaks in lists)
  hoveredPeakId: string | null;
  
  // Pending camera actions (consumed by explore layout)
  pendingFitBounds: { bounds: [[number, number], [number, number]]; padding: FitBoundsPadding } | null;
  pendingFlyTo: { center: [number, number]; zoom?: number } | null;
  
  // ============================================================================
  // FOCUS ACTIONS - The main way to change what the map displays
  // ============================================================================
  
  // Set focus to discovery (clears all overlays)
  focusDiscovery: () => void;
  
  // Set focus to a challenge
  focusChallenge: (challengeId: string, peaks: Array<Peak & { is_summited?: boolean }>) => void;
  
  // Set focus to a user's peaks
  focusUser: (userId: string, peaks: Peak[]) => void;
  
  // Set focus to a specific peak (preserves parent context if coming from challenge/user)
  focusPeak: (peakId: string, coords: [number, number]) => void;
  
  // Update focus peaks (e.g., when summit status changes)
  updateFocusPeaks: (peaks: Array<Peak & { is_summited?: boolean }>) => void;
  
  // ============================================================================
  // LEGACY ACTIONS - For backwards compatibility during migration
  // ============================================================================
  
  setVisiblePeaks: (peaks: Peak[]) => void;
  setVisibleChallenges: (challenges: ChallengeProgress[]) => void;
  setSelectedPeakId: (id: string | null) => void;
  setSelectedChallengeId: (id: string | null) => void;
  setSelectionMode: (mode: SelectionMode) => void;
  setIsZoomedOutTooFar: (value: boolean) => void;
  setIsSatellite: (value: boolean) => void;
  setCurrentZoom: (zoom: number) => void;
  setCurrentCenter: (center: [number, number]) => void;
  setCurrentBounds: (bounds: [[number, number], [number, number]]) => void;
  setHoveredPeakId: (id: string | null) => void;
  setInitialLocationReady: (ready: boolean) => void;
  
  // Compound selection actions (for floating cards)
  selectPeak: (id: string) => void;
  selectChallenge: (id: string) => void;
  openDetail: () => void;
  clearSelection: () => void;
  
  // Map region update
  updateMapRegion: (region: {
    center: [number, number];
    zoom: number;
    bounds: [[number, number], [number, number]];
  }) => void;
  
  // Camera actions
  requestFitToBounds: (bounds: [[number, number], [number, number]], padding: FitBoundsPadding) => void;
  clearPendingFitBounds: () => void;
  requestFlyTo: (center: [number, number], zoom?: number) => void;
  clearPendingFlyTo: () => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  // Initial state
  mapFocus: { type: 'discovery' },
  visiblePeaks: [],
  visibleChallenges: [],
  selectedPeakId: null,
  selectedChallengeId: null,
  selectionMode: 'none',
  isZoomedOutTooFar: false,
  isSatellite: false,
  currentZoom: 11,
  currentCenter: null,
  isInitialLocationReady: false,
  currentBounds: null,
  hoveredPeakId: null,
  pendingFitBounds: null,
  pendingFlyTo: null,
  
  // ============================================================================
  // FOCUS ACTIONS
  // ============================================================================
  
  focusDiscovery: () => set({
    mapFocus: { type: 'discovery' },
    selectedPeakId: null,
    selectedChallengeId: null,
    selectionMode: 'none',
  }),
  
  focusChallenge: (challengeId, peaks) => set({
    mapFocus: { type: 'challenge', challengeId, peaks },
    selectedChallengeId: challengeId,
    selectedPeakId: null,
  }),
  
  focusUser: (userId, peaks) => set({
    mapFocus: { type: 'user', userId, peaks },
    selectedPeakId: null,
    selectedChallengeId: null,
  }),
  
  focusPeak: (peakId, coords) => {
    // Simple behavior: just focus on the peak, don't preserve parent context
    // This makes navigation cleaner - when you click a peak, you see the peak
    set({
      mapFocus: { type: 'peak', peakId, coords },
      selectedPeakId: peakId,
      selectedChallengeId: null,
    });
  },
  
  updateFocusPeaks: (peaks) => {
    const currentFocus = get().mapFocus;
    if (currentFocus.type === 'challenge') {
      set({ mapFocus: { ...currentFocus, peaks } });
    } else if (currentFocus.type === 'user') {
      set({ mapFocus: { ...currentFocus, peaks } });
    }
  },
  
  // ============================================================================
  // LEGACY ACTIONS
  // ============================================================================
  
  setVisiblePeaks: (peaks) => set({ visiblePeaks: peaks }),
  setVisibleChallenges: (challenges) => set({ visibleChallenges: challenges }),
  
  setSelectedPeakId: (id) => set({
    selectedPeakId: id,
    selectedChallengeId: null,
  }),
  
  setSelectedChallengeId: (id) => set({
    selectedChallengeId: id,
    selectedPeakId: null,
  }),
  
  setSelectionMode: (mode) => set({ selectionMode: mode }),
  setIsZoomedOutTooFar: (value) => set({ isZoomedOutTooFar: value }),
  setIsSatellite: (value) => set({ isSatellite: value }),
  
  setCurrentZoom: (zoom) => set({ 
    currentZoom: zoom,
    isZoomedOutTooFar: zoom < MIN_SEARCH_ZOOM,
  }),
  
  setCurrentCenter: (center) => set({ currentCenter: center }),
  setCurrentBounds: (bounds) => set({ currentBounds: bounds }),
  setHoveredPeakId: (id) => set({ hoveredPeakId: id }),
  setInitialLocationReady: (ready) => set({ isInitialLocationReady: ready }),
  
  // Compound selection actions
  selectPeak: (id) => set({
    selectedPeakId: id,
    selectedChallengeId: null,
    selectionMode: 'floating',
  }),
  
  selectChallenge: (id) => set({
    selectedChallengeId: id,
    selectedPeakId: null,
    selectionMode: 'floating',
  }),
  
  openDetail: () => set({ selectionMode: 'detail' }),
  
  clearSelection: () => set({
    selectedPeakId: null,
    selectedChallengeId: null,
    selectionMode: 'none',
  }),
  
  updateMapRegion: (region) => {
    const isZoomedOutTooFar = region.zoom < MIN_SEARCH_ZOOM;
    set({
      currentCenter: region.center,
      currentZoom: region.zoom,
      currentBounds: region.bounds,
      isZoomedOutTooFar,
    });
  },
  
  // Camera actions
  requestFitToBounds: (bounds, padding) => set({
    pendingFitBounds: { bounds, padding },
  }),
  
  clearPendingFitBounds: () => set({
    pendingFitBounds: null,
  }),
  
  requestFlyTo: (center, zoom) => set({
    pendingFlyTo: { center, zoom },
  }),
  
  clearPendingFlyTo: () => set({
    pendingFlyTo: null,
  }),
}));

// Export MIN_SEARCH_ZOOM for use in other components
export { MIN_SEARCH_ZOOM };
