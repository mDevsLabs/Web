"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function ButtonGroup({ label, className, ...props }) {
  return /* @__PURE__ */ jsx("div", { ...props, role: "group", "aria-label": label, className: cx("md-button-group", className) });
}
export {
  ButtonGroup
};
