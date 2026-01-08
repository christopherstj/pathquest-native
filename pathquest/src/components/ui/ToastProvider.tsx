/**
 * ToastProvider
 *
 * Renders the global toast notification.
 * Place this at the root of your app (in _layout.tsx).
 */

import React from "react";
import Toast from "./Toast";
import { useToastStore } from "@/src/store/toastStore";

const ToastProvider: React.FC = () => {
  const toast = useToastStore((s) => s.toast);
  const hide = useToastStore((s) => s.hide);

  return (
    <Toast
      visible={!!toast}
      message={toast?.message ?? ""}
      title={toast?.title}
      variant={toast?.variant}
      duration={toast?.duration ?? 4000}
      onDismiss={hide}
    />
  );
};

export default ToastProvider;

