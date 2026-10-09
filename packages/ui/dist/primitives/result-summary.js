"use client";
"use client";
import { jsxs } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function ResultSummary({ total, page, pageSize, label = "r\xE9sultats", className, ...props }) {
  const count = Number.isFinite(total) ? Math.max(0, Math.floor(total)) : 0;
  const size = Number.isFinite(pageSize) ? Math.max(1, Math.floor(pageSize)) : 1;
  const current = Number.isFinite(page) ? Math.max(1, Math.min(Math.max(1, Math.ceil(count / size)), Math.floor(page))) : 1;
  const start = count ? (current - 1) * size + 1 : 0;
  return /* @__PURE__ */ jsxs("p", { ...props, role: "status", className: cx("md-muted", className), children: [
    start,
    "\u2013",
    Math.min(count, current * size),
    " sur ",
    count,
    " ",
    label
  ] });
}
export {
  ResultSummary
};
