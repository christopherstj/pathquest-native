/**
 * Explore Navigation Store
 * 
 * Manages discovery state persistence for the Explore tab.
 * Navigation history is handled by Expo Router's native stack.
 */

import { create } from 'zustand';

// Discovery state that persists when navigating to/from detail pages
export interface DiscoveryState {
  activeTab: 'peaks' | 'challenges';
  challengeFilter: 'inView' | 'all';
  searchQuery: string;
}

interface ExploreNavState {
  // Current discovery state (persisted across navigations)
  discoveryState: DiscoveryState;
  
  // Discovery state setters
  setDiscoveryTab: (tab: 'peaks' | 'challenges') => void;
  setChallengeFilter: (filter: 'inView' | 'all') => void;
  setSearchQuery: (query: string) => void;
}

const DEFAULT_DISCOVERY_STATE: DiscoveryState = {
  activeTab: 'peaks',
  challengeFilter: 'inView',
  searchQuery: '',
};

export const useExploreNavStore = create<ExploreNavState>((set) => ({
  discoveryState: DEFAULT_DISCOVERY_STATE,
  
  setDiscoveryTab: (tab) => {
    set((state) => ({
      discoveryState: { ...state.discoveryState, activeTab: tab },
    }));
  },
  
  setChallengeFilter: (filter) => {
    set((state) => ({
      discoveryState: { ...state.discoveryState, challengeFilter: filter },
    }));
  },
  
  setSearchQuery: (query) => {
    set((state) => ({
      discoveryState: { ...state.discoveryState, searchQuery: query },
    }));
  },
}));
