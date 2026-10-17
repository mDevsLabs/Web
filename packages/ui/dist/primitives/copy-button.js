"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { cx } from "../internal/utils.js";
function CopyButton({ value, onCopied, onError, children = "Copier", className, ...props }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(void 0);
  useEffect(() => () => clearTimeout(timer.current), []);
  return /* @__PURE__ */ jsxs("button", { ...props, type: "button", className: cx("md-button md-button-soft", className), onClick: async (e) => {
    props.onClick?.(e);
    if (e.defaultPrevented)
      return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopied?.();
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      onError?.(error);
    }
  }, children: [
    copied ? "Copi\xE9" : children,
    /* @__PURE__ */ jsx("span", { className: "md-sr-only", role: "status", children: copied ? "Copi\xE9 dans le presse-papiers." : "" })
  ] });
}
export {
  CopyButton
};
