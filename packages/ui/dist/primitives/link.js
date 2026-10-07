"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function Link({ className, target, rel, ...props }) {
  return /* @__PURE__ */ jsx("a", { ...props, target, rel: rel ?? (target === "_blank" ? "noopener noreferrer" : void 0), className: cx("md-link", className) });
}
export {
  Link
};
