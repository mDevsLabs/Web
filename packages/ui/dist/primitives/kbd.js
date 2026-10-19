"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function Kbd({ className, ...props }) {
  return /* @__PURE__ */ jsx("kbd", { ...props, className: cx("md-kbd", className) });
}
export {
  Kbd
};
