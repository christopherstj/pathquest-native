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

interface MapState {
  // Visible items in current viewport
  visiblePeaks: Peak[];
  visibleChallenges: ChallengeProgress[];
  
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
  
  // Hover state (for highlighting peaks in lists)
  hoveredPeakId: string | null;
  
  // Actions
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
}

export const useMapStore = create<MapState>((set, get) => ({
  // Initial state
  visiblePeaks: [],
  visibleChallenges: [],
  selectedPeakId: null,
  selectedChallengeId: null,
  selectionMode: 'none',
  isZoomedOutTooFar: false,
  isSatellite: false,
  currentZoom: 11,
  currentCenter: null,
  currentBounds: null,
  hoveredPeakId: null,
  
  // Basic setters
  setVisiblePeaks: (peaks) => set({ visiblePeaks: peaks }),
  setVisibleChallenges: (challenges) => set({ visibleChallenges: challenges }),
  setSelectedPeakId: (id) => set({ selectedPeakId: id, selectedChallengeId: null }),
  setSelectedChallengeId: (id) => set({ selectedChallengeId: id, selectedPeakId: null }),
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
  
  // Compound actions - select and show floating card
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
  clearSelection: () => set({
    selectedPeakId: null,
    selectedChallengeId: null,
    selectionMode: 'none',
  }),
}));

// Export MIN_SEARCH_ZOOM for use in other components
export { MIN_SEARCH_ZOOM };

