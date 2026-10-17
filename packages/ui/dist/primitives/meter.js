"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function Meter({ label, className, ...props }) {
  return /* @__PURE__ */ jsx("meter", { ...props, "aria-label": label, className: cx("md-meter", className) });
}
export {
  Meter
};
