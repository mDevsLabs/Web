"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function Progress({ value, max = 100, label, className, ...props }) {
  const bound = Math.max(1, max);
  const current = value === void 0 ? void 0 : Math.max(0, Math.min(bound, value));
  return /* @__PURE__ */ jsx("div", { ...props, role: "progressbar", "aria-label": label, "aria-valuemin": 0, "aria-valuemax": bound, "aria-valuenow": current, className: cx("md-progress", className), "data-indeterminate": current === void 0 || void 0, children: /* @__PURE__ */ jsx("span", { style: { width: current === void 0 ? "40%" : `${current / bound * 100}%` } }) });
}
export {
  Progress
};
