"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function Code({ className, ...props }) {
  return /* @__PURE__ */ jsx("code", { ...props, className: cx("md-code", className) });
}
export {
  Code
};
