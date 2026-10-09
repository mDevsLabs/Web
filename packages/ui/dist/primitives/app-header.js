"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function AppHeader({ brand, navigation, actions, children, className, ...props }) {
  return /* @__PURE__ */ jsxs("header", { ...props, className: cx("md-app-header md-glass", className), children: [
    /* @__PURE__ */ jsx("div", { className: "md-app-brand", children: brand }),
    navigation && /* @__PURE__ */ jsx("div", { className: "md-app-navigation", children: navigation }),
    actions && /* @__PURE__ */ jsx("div", { className: "md-cluster", children: actions }),
    children
  ] });
}
export {
  AppHeader
};
