"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import { cx } from "../internal/utils.js";
function SelectableTable({ caption, columns, rows, selectedIds, onSelectionChange, className, ...props }) {
  const all = useRef(null);
  const count = rows.filter((row) => selectedIds.includes(row.id)).length;
  useEffect(() => {
    if (all.current)
      all.current.indeterminate = count > 0 && count < rows.length;
  }, [count, rows.length]);
  const selectPage = (checked) => onSelectionChange(checked ? [.../* @__PURE__ */ new Set([...selectedIds, ...rows.map((row) => row.id)])] : selectedIds.filter((id) => !rows.some((row) => row.id === id)));
  return /* @__PURE__ */ jsx("div", { ...props, className: cx("md-table-wrap", className), tabIndex: 0, role: "region", "aria-label": caption, children: /* @__PURE__ */ jsxs("table", { className: "md-table", children: [
    /* @__PURE__ */ jsx("caption", { children: caption }),
    /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
      /* @__PURE__ */ jsx("th", { scope: "col", children: /* @__PURE__ */ jsx("input", { ref: all, type: "checkbox", "aria-label": "S\xE9lectionner les lignes de cette page", disabled: !rows.length, checked: !!rows.length && count === rows.length, onChange: (event) => selectPage(event.target.checked) }) }),
      columns.map((column) => /* @__PURE__ */ jsx("th", { scope: "col", children: column.label }, column.key))
    ] }) }),
    /* @__PURE__ */ jsxs("tbody", { children: [
      rows.map((row) => /* @__PURE__ */ jsxs("tr", { "data-selected": selectedIds.includes(row.id) || void 0, children: [
        /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("input", { type: "checkbox", "aria-label": `S\xE9lectionner la ligne ${row.id}`, checked: selectedIds.includes(row.id), onChange: (event) => onSelectionChange(event.target.checked ? [...selectedIds, row.id] : selectedIds.filter((id) => id !== row.id)) }) }),
        columns.map((column) => /* @__PURE__ */ jsx("td", { children: row[column.key] }, column.key))
      ] }, row.id)),
      !rows.length && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: columns.length + 1, children: "Aucune ligne." }) })
    ] })
  ] }) });
}
export {
  SelectableTable
};
