"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function AnchorNavigation({ label, items, activeId, className, ...props }) {
  return /* @__PURE__ */ jsx("nav", { ...props, "aria-label": label, className: cx("md-anchor-navigation", className), children: /* @__PURE__ */ jsx("ol", { children: items.map((item) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: `#${encodeURIComponent(item.id)}`, "aria-current": activeId === item.id ? "location" : void 0, children: item.label }) }, item.id)) }) });
}
export {
  AnchorNavigation
};
