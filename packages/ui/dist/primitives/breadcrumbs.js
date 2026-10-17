"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function Breadcrumbs({ items, label = "Fil d\u2019Ariane", className, ...props }) {
  return /* @__PURE__ */ jsx("nav", { ...props, "aria-label": label, className: cx("md-breadcrumbs", className), children: /* @__PURE__ */ jsx("ol", { children: items.map((item, i) => /* @__PURE__ */ jsxs("li", { children: [
    i > 0 && /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: "/" }),
    i === items.length - 1 ? /* @__PURE__ */ jsx("span", { "aria-current": "page", children: item.label }) : item.href ? /* @__PURE__ */ jsx("a", { href: item.href, children: item.label }) : /* @__PURE__ */ jsx("span", { children: item.label })
  ] }, i)) }) });
}
export {
  Breadcrumbs
};
