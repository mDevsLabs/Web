import { type RefObject, useEffect } from "react";

/**
 * Closes a dropdown/menu when the user clicks outside the container element.
 * Replaces the repeated pattern of individual useEffect per menu.
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void
): void {
  useEffect(() => {
    if (!open) {
      return;
    }
    const handler = (e: MouseEvent) => {
      if (ref.current?.contains(e.target as Node)) {
        return;
      }
      onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, open, onClose]);
}
