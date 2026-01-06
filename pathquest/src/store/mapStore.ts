/**
 * Map Store
 * 
 * Manages the state of the map including:
 * - Visible peaks and challenges in the current viewport
 * - Selected peak/challenge for detail view
 * - Selection mode (none, floating card, full detail)
 * - Map interaction state (zoomed out too far, satellite mode, etc.)
 * - Hovered peak for highlighting
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

// Pending fit bounds request
export interface PendingFitBounds {
  bounds: [[number, number], [number, number]];
  padding: FitBoundsPadding;
}

interface MapState {
  // Visible items in current viewport
  visiblePeaks: Peak[];
  visibleChallenges: ChallengeProgress[];

  // Challenge overlay state (Show on Map)
  challengeOverlayPeaks: Array<Peak & { is_summited?: boolean }> | null;

  // User overlay state (Explore user profile: show user's summited peaks)
  userOverlayPeaks: Peak[] | null;
  
  // Selection state
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
  
  // Pending fit bounds request (for "Show on Map")
  pendingFitBounds: PendingFitBounds | null;
  
  // Actions
  setVisiblePeaks: (peaks: Peak[]) => void;
  setVisibleChallenges: (challenges: ChallengeProgress[]) => void;
  setChallengeOverlayPeaks: (peaks: Array<Peak & { is_summited?: boolean }> | null) => void;
  setUserOverlayPeaks: (peaks: Peak[] | null) => void;
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
  
  // Compound actions
  selectPeak: (id: string) => void;
  selectChallenge: (id: string) => void;
  openDetail: () => void;
  
  // Computed helpers
  updateMapRegion: (region: {
    center: [number, number];
    zoom: number;
    bounds: [[number, number], [number, number]];
  }) => void;
  clearSelection: () => void;
  
  // Fit bounds actions (for "Show on Map")
  requestFitToBounds: (bounds: [[number, number], [number, number]], padding: FitBoundsPadding) => void;
  clearPendingFitBounds: () => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  // Initial state
  visiblePeaks: [],
  visibleChallenges: [],
  challengeOverlayPeaks: null,
  userOverlayPeaks: null,
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
  
  // Basic setters
  setVisiblePeaks: (peaks) => set({ visiblePeaks: peaks }),
  setVisibleChallenges: (challenges) => set({ visibleChallenges: challenges }),
  setChallengeOverlayPeaks: (peaks) => set({ challengeOverlayPeaks: peaks }),
  setUserOverlayPeaks: (peaks) => set({ userOverlayPeaks: peaks }),
  setSelectedPeakId: (id) =>
    set({
      selectedPeakId: id,
      selectedChallengeId: null,
      // Do NOT clear overlays - they should persist until explicitly cleared
    }),
  setSelectedChallengeId: (id) =>
    set({
      selectedChallengeId: id,
      selectedPeakId: null,
      // Do NOT clear overlays - they should persist until explicitly cleared
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
  
  // Compound actions - select and show floating card
  // NOTE: These preserve overlays so clicking a peak in an overlay doesn't clear it
  selectPeak: (id) => set({
    selectedPeakId: id,
    selectedChallengeId: null,
    selectionMode: 'floating',
    // Do NOT clear challengeOverlayPeaks or userOverlayPeaks here!
    // Overlays should persist until explicitly cleared (e.g., navigating to discovery)
  }),
  selectChallenge: (id) => set({
    selectedChallengeId: id,
    selectedPeakId: null,
    selectionMode: 'floating',
    // Do NOT clear overlays here either
  }),
  
  // Open full detail view from floating card
  openDetail: () => set({ selectionMode: 'detail' }),
  
  // Update all map region state at once
  updateMapRegion: (region) => {
    const isZoomedOutTooFar = region.zoom < MIN_SEARCH_ZOOM;
    set({
      currentCenter: region.center,
      currentZoom: region.zoom,
      currentBounds: region.bounds,
      isZoomedOutTooFar,
    });
  },
  
  // Clear selection and reset mode
  // NOTE: This does NOT clear overlays - overlays are cleared separately when navigating to discovery
  clearSelection: () => set({
    selectedPeakId: null,
    selectedChallengeId: null,
    selectionMode: 'none',
  }),
  
  // Request a fit-to-bounds (will be handled by explore layout)
  requestFitToBounds: (bounds, padding) => set({
    pendingFitBounds: { bounds, padding },
  }),
  
  // Clear the pending fit bounds (after it's been handled)
  clearPendingFitBounds: () => set({
    pendingFitBounds: null,
  }),
}));

// Export MIN_SEARCH_ZOOM for use in other components
export { MIN_SEARCH_ZOOM };

