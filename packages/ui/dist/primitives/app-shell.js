"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function AppShell({ header, sidebar, footer, children, mainId = "main-content", mainLabel = "Contenu principal", className, ...props }) {
  return /* @__PURE__ */ jsxs("div", { ...props, className: cx("md-app-shell", className), children: [
    header,
    /* @__PURE__ */ jsxs("div", { className: "md-shell-body", children: [
      sidebar && /* @__PURE__ */ jsx("aside", { "aria-label": "Navigation et outils", className: "md-shell-sidebar", children: sidebar }),
      /* @__PURE__ */ jsx("main", { id: mainId, tabIndex: -1, "aria-label": mainLabel, children })
    ] }),
    footer
  ] });
}
export {
  AppShell
};
