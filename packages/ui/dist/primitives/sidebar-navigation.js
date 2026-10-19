"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { cx } from "../internal/utils.js";
function SidebarNavigation({ label, sections, currentId, className, ...props }) {
  const prefix = useId();
  return /* @__PURE__ */ jsx("nav", { ...props, "aria-label": label, className: cx("md-sidebar-navigation", className), children: sections.map((section, index) => /* @__PURE__ */ jsxs("section", { "aria-labelledby": `${prefix}-${index}`, children: [
    /* @__PURE__ */ jsx("h2", { id: `${prefix}-${index}`, children: section.label }),
    /* @__PURE__ */ jsx("ul", { children: section.items.map((item) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("a", { href: item.href, "aria-current": item.id === currentId ? "page" : void 0, children: [
      /* @__PURE__ */ jsx("span", { children: item.label }),
      item.count !== void 0 && /* @__PURE__ */ jsx("span", { className: "md-badge", children: item.count })
    ] }) }, item.id)) })
  ] }, section.id)) });
}
export {
  SidebarNavigation
};
