"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function EmptyState({ heading, description, action, className, ...props }) {
  return /* @__PURE__ */ jsxs("div", { ...props, className: cx("md-empty", className), children: [
    /* @__PURE__ */ jsx("span", { className: "md-empty-mark", "aria-hidden": "true", children: "\u25C7" }),
    /* @__PURE__ */ jsx("h3", { children: heading }),
    description && /* @__PURE__ */ jsx("p", { className: "md-muted", children: description }),
    action
  ] });
}
export {
  EmptyState
};
