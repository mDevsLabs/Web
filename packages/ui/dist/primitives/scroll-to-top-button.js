"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { cx } from "../internal/utils.js";
function ScrollToTopButton({ threshold = 300, children = "Retour en haut", className, onClick, ...props }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const update = () => setVisible(window.scrollY >= threshold);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [threshold]);
  return /* @__PURE__ */ jsx("button", { ...props, type: "button", hidden: !visible, className: cx("md-button md-button-outline md-scroll-top", className), onClick: (event) => {
    onClick?.(event);
    if (!event.defaultPrevented)
      window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, children });
}
export {
  ScrollToTopButton
};
