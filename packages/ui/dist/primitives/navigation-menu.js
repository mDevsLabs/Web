"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function NavigationMenu({ items, label, className, ...props }) {
  return /* @__PURE__ */ jsx("nav", { ...props, "aria-label": label, className: cx("md-navigation", className), children: /* @__PURE__ */ jsx("ul", { children: items.map((item) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: item.href, "aria-current": item.active ? "page" : void 0, children: item.label }) }, item.href)) }) });
}
export {
  NavigationMenu
};
