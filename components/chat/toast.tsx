"use client";

import { toast as sonnerToast } from "sonner";

export type ToastOptions = {
  description: string;
  type?: "success" | "error" | "info" | "warning";
};

export function toast(props: ToastOptions | string) {
  if (typeof props === "string") {
    return sonnerToast(props);
  }
  if (props.type === "error") {
    return sonnerToast.error(props.description);
  }
  if (props.type === "warning") {
    return sonnerToast.warning(props.description);
  }
  if (props.type === "info") {
    return sonnerToast.info(props.description);
  }
  return sonnerToast.success(props.description);
}

// Re-export standard sonner toast helpers to ensure uniform designs everywhere
toast.success = sonnerToast.success;
toast.error = sonnerToast.error;
toast.info = sonnerToast.info;
toast.warning = sonnerToast.warning;
toast.custom = sonnerToast.custom;
toast.message = sonnerToast.message;
toast.promise = sonnerToast.promise;
toast.dismiss = sonnerToast.dismiss;
