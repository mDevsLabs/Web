"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function Pagination({ page, totalPages, onPageChange, label = "Pagination", className, ...props }) {
  const total = Math.max(1, Math.floor(totalPages));
  const current = Math.max(1, Math.min(total, page));
  return /* @__PURE__ */ jsxs("nav", { ...props, "aria-label": label, className: cx("md-pagination", className), children: [
    /* @__PURE__ */ jsx("button", { type: "button", className: "md-button md-button-outline", disabled: current <= 1, onClick: () => onPageChange(current - 1), children: "Pr\xE9c\xE9dent" }),
    /* @__PURE__ */ jsxs("span", { "aria-live": "polite", children: [
      current,
      " / ",
      total
    ] }),
    /* @__PURE__ */ jsx("button", { type: "button", className: "md-button md-button-outline", disabled: current >= total, onClick: () => onPageChange(current + 1), children: "Suivant" })
  ] });
}
export {
  Pagination
};
