/**
 * Sheet Store
 * 
 * Manages the state of the bottom sheet (ContentSheet) including:
 * - Current snap index
 * - Programmatic control actions
 */

import { create } from 'zustand';

export type SheetSnapPoint = 'collapsed' | 'halfway' | 'expanded';

interface SheetState {
  // Current snap point index (0 = collapsed, 1 = halfway, 2 = expanded)
  snapIndex: number;
  
  // Actions
  setSnapIndex: (index: number) => void;
  snapTo: (point: SheetSnapPoint) => void;
  expand: () => void;
  collapse: () => void;
}

const snapPointToIndex: Record<SheetSnapPoint, number> = {
  collapsed: 0,
  halfway: 1,
  expanded: 2,
};

export const useSheetStore = create<SheetState>((set) => ({
  snapIndex: 1, // Start at halfway
  
  setSnapIndex: (index) => set({ snapIndex: index }),
  
  snapTo: (point) => set({ snapIndex: snapPointToIndex[point] }),
  
  expand: () => set({ snapIndex: 2 }),
  
  collapse: () => set({ snapIndex: 0 }),
}));

