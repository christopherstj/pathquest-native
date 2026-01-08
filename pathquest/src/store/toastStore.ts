/**
 * Toast Store
 *
 * Global state management for toast notifications.
 * Provides a simple API to show toasts from anywhere in the app.
 *
 * Usage:
 * import { useToast } from '@/src/store/toastStore';
 *
 * const toast = useToast();
 * toast.success("Photo uploaded!");
 * toast.error("Upload failed", "Please try again");
 */

import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastData {
  id: string;
  message: string;
  title?: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastState {
  /** Current toast (only one at a time) */
  toast: ToastData | null;

  /** Show a toast */
  show: (options: {
    message: string;
    title?: string;
    variant?: ToastVariant;
    duration?: number;
  }) => void;

  /** Hide the current toast */
  hide: () => void;

  /** Convenience methods */
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toast: null,

  show: ({ message, title, variant = "info", duration = 4000 }) => {
    set({
      toast: {
        id: `toast-${Date.now()}`,
        message,
        title,
        variant,
        duration,
      },
    });
  },

  hide: () => {
    set({ toast: null });
  },

  success: (message, title) => {
    set({
      toast: {
        id: `toast-${Date.now()}`,
        message,
        title,
        variant: "success",
        duration: 3000,
      },
    });
  },

  error: (message, title) => {
    set({
      toast: {
        id: `toast-${Date.now()}`,
        message,
        title,
        variant: "error",
        duration: 5000,
      },
    });
  },

  info: (message, title) => {
    set({
      toast: {
        id: `toast-${Date.now()}`,
        message,
        title,
        variant: "info",
        duration: 4000,
      },
    });
  },

  warning: (message, title) => {
    set({
      toast: {
        id: `toast-${Date.now()}`,
        message,
        title,
        variant: "warning",
        duration: 4000,
      },
    });
  },
}));

/**
 * Hook for showing toasts
 */
export function useToast() {
  const show = useToastStore((s) => s.show);
  const hide = useToastStore((s) => s.hide);
  const success = useToastStore((s) => s.success);
  const error = useToastStore((s) => s.error);
  const info = useToastStore((s) => s.info);
  const warning = useToastStore((s) => s.warning);

  return { show, hide, success, error, info, warning };
}

export default useToastStore;

