"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function Heading({ level = 2, className, ...props }) {
  const Tag = `h${level}`;
  return /* @__PURE__ */ jsx(Tag, { ...props, className: cx("md-heading", className) });
}
export {
  Heading
};
