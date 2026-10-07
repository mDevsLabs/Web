"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function Announcer({ message, priority = "polite", visible = false, className, ...props }) {
  return /* @__PURE__ */ jsx("div", { ...props, role: priority === "assertive" ? "alert" : "status", "aria-live": priority, "aria-atomic": "true", className: cx(!visible && "md-sr-only", className), children: message });
}
export {
  Announcer
};
