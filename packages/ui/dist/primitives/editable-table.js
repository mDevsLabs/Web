"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function EditableTable({ caption, columns, value, onValueChange, disabled, className, ...props }) {
  return /* @__PURE__ */ jsx("div", { ...props, className: cx("md-table-wrap", className), role: "region", "aria-label": caption, tabIndex: 0, children: /* @__PURE__ */ jsxs("table", { className: "md-table", children: [
    /* @__PURE__ */ jsx("caption", { children: caption }),
    /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { children: columns.map((column) => /* @__PURE__ */ jsx("th", { scope: "col", children: column.label }, column.key)) }) }),
    /* @__PURE__ */ jsxs("tbody", { children: [
      value.map((row) => /* @__PURE__ */ jsx("tr", { children: columns.map((column) => /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("input", { className: "md-input", "aria-label": `${column.label}, ligne ${row.id}`, disabled: disabled || column.key === "id", value: row[column.key] ?? "", onChange: (event) => {
        if (column.key !== "id")
          onValueChange(value.map((item) => item.id === row.id ? { ...item, [column.key]: event.target.value } : item));
      } }) }, column.key)) }, row.id)),
      !value.length && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: Math.max(1, columns.length), children: "Aucune ligne." }) })
    ] })
  ] }) });
}
export {
  EditableTable
};
