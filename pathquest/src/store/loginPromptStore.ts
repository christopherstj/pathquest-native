/**
 * Login Prompt Store
 * 
 * Manages the state of the login prompt modal including:
 * - Whether the modal is visible
 * - The context/reason for showing the prompt
 * - Custom messaging based on the action the user tried to take
 */

import { create } from 'zustand';

export type LoginPromptContext = 
  | 'favorite_peak'
  | 'favorite_challenge'
  | 'add_report'
  | 'manual_summit'
  | 'track_progress'
  | 'view_your_logs'
  | 'generic';

interface LoginPromptState {
  isVisible: boolean;
  context: LoginPromptContext;
  
  // Actions
  showPrompt: (context?: LoginPromptContext) => void;
  hidePrompt: () => void;
}

// Context-specific messaging
export const LOGIN_PROMPT_MESSAGES: Record<LoginPromptContext, { title: string; description: string }> = {
  favorite_peak: {
    title: 'Save Your Favorites',
    description: 'Sign in to save peaks to your favorites and get personalized recommendations.',
  },
  favorite_challenge: {
    title: 'Track Your Progress',
    description: 'Sign in to accept this challenge and track your progress toward completion.',
  },
  add_report: {
    title: 'Share Your Experience',
    description: 'Sign in to add trip reports and share conditions with the community.',
  },
  manual_summit: {
    title: 'Log Your Summit',
    description: 'Sign in to manually log summits and build your peak collection.',
  },
  track_progress: {
    title: 'Track Your Progress',
    description: 'Sign in to see your progress on this challenge and track remaining peaks.',
  },
  view_your_logs: {
    title: 'View Your Summit History',
    description: 'Sign in to see your ascent history and trip reports for this peak.',
  },
  generic: {
    title: 'Sign In to Continue',
    description: 'Connect with Strava to unlock all features and track your mountain adventures.',
  },
};

export const useLoginPromptStore = create<LoginPromptState>((set) => ({
  isVisible: false,
  context: 'generic',
  
  showPrompt: (context = 'generic') => set({
    isVisible: true,
    context,
  }),
  
  hidePrompt: () => set({
    isVisible: false,
  }),
}));

