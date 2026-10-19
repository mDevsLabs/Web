"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import { cx } from "../internal/utils.js";
function FilterChips({ label, filters, onRemove, onClear, className, ...props }) {
  const region = useRef(null);
  const shouldFocus = useRef(false);
  useEffect(() => {
    if (shouldFocus.current) {
      shouldFocus.current = false;
      const target = region.current?.querySelector("button");
      if (target)
        target.focus();
      else
        region.current?.focus();
    }
  }, [filters.length]);
  return /* @__PURE__ */ jsxs("div", { ...props, ref: region, tabIndex: -1, role: "group", "aria-label": label, className: cx("md-filter-chips", className), children: [
    filters.map((filter) => /* @__PURE__ */ jsxs("span", { className: "md-filter-chip", children: [
      filter.label,
      /* @__PURE__ */ jsx("button", { type: "button", "aria-label": `Retirer le filtre ${filter.label}`, onClick: () => {
        shouldFocus.current = true;
        onRemove(filter.id);
      }, children: "\xD7" })
    ] }, filter.id)),
    onClear && filters.length > 0 && /* @__PURE__ */ jsx("button", { type: "button", className: "md-button md-button-ghost", onClick: () => {
      shouldFocus.current = true;
      onClear();
    }, children: "Tout effacer" }),
    !filters.length && /* @__PURE__ */ jsx("span", { className: "md-muted", children: "Aucun filtre actif." })
  ] });
}
export {
  FilterChips
};
