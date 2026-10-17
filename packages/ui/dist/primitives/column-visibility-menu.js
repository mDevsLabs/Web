"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function ColumnVisibilityMenu({ label, columns, visibleKeys, onVisibilityChange, className, ...props }) {
  return /* @__PURE__ */ jsx("div", { ...props, className: cx("md-column-menu", className), children: /* @__PURE__ */ jsxs("details", { children: [
    /* @__PURE__ */ jsx("summary", { children: label }),
    /* @__PURE__ */ jsxs("fieldset", { className: "md-form-section", children: [
      /* @__PURE__ */ jsx("legend", { children: "Colonnes visibles" }),
      columns.map((column) => /* @__PURE__ */ jsxs("label", { className: "md-choice-row", children: [
        /* @__PURE__ */ jsx("input", { type: "checkbox", checked: !!column.required || visibleKeys.includes(column.key), disabled: column.required, onChange: (event) => onVisibilityChange(event.target.checked ? [.../* @__PURE__ */ new Set([...visibleKeys, column.key])] : visibleKeys.filter((key) => key !== column.key)) }),
        column.label
      ] }, column.key))
    ] })
  ] }) });
}
export {
  ColumnVisibilityMenu
};
