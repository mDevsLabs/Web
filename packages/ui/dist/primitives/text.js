"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function Text({ tone = "default", className, ...props }) {
  return /* @__PURE__ */ jsx("span", { ...props, className: cx("md-text", className), "data-tone": tone });
}
export {
  Text
};
