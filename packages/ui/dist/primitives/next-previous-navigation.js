"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function NextPreviousNavigation({ previous, next, label = "Documents voisins", className, ...props }) {
  return /* @__PURE__ */ jsxs("nav", { ...props, "aria-label": label, className: cx("md-neighbor-navigation", className), children: [
    previous ? /* @__PURE__ */ jsxs("a", { href: previous.href, rel: "prev", children: [
      /* @__PURE__ */ jsx("small", { children: "Pr\xE9c\xE9dent" }),
      /* @__PURE__ */ jsx("strong", { children: previous.label })
    ] }) : /* @__PURE__ */ jsx("span", {}),
    next ? /* @__PURE__ */ jsxs("a", { href: next.href, rel: "next", children: [
      /* @__PURE__ */ jsx("small", { children: "Suivant" }),
      /* @__PURE__ */ jsx("strong", { children: next.label })
    ] }) : /* @__PURE__ */ jsx("span", {})
  ] });
}
export {
  NextPreviousNavigation
};
