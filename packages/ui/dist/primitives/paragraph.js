"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function Paragraph({ className, ...props }) {
  return /* @__PURE__ */ jsx("p", { ...props, className: cx("md-paragraph", className) });
}
export {
  Paragraph
};
