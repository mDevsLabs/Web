"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { Fragment as ReactFragment, useId } from "react";
import { cx } from "../internal/utils.js";
function ExpandableTable({ caption, columns, rows, expandedIds, onExpandedChange, className, ...props }) {
  const id = useId();
  return /* @__PURE__ */ jsx("div", { ...props, className: cx("md-table-wrap", className), role: "region", "aria-label": caption, tabIndex: 0, children: /* @__PURE__ */ jsxs("table", { className: "md-table", children: [
    /* @__PURE__ */ jsx("caption", { children: caption }),
    /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
      /* @__PURE__ */ jsx("th", { scope: "col", children: "D\xE9tails" }),
      columns.map((column) => /* @__PURE__ */ jsx("th", { scope: "col", children: column.label }, column.key))
    ] }) }),
    /* @__PURE__ */ jsxs("tbody", { children: [
      rows.map((row, index) => {
        const expanded = expandedIds.includes(row.id);
        return /* @__PURE__ */ jsxs(ReactFragment, { children: [
          /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("button", { type: "button", className: "md-button md-button-ghost", "aria-label": `D\xE9tails de la ligne ${row.id}`, "aria-expanded": expanded, "aria-controls": `${id}-${index}`, onClick: () => onExpandedChange(expanded ? expandedIds.filter((item) => item !== row.id) : [...expandedIds, row.id]), children: expanded ? "\u2212" : "+" }) }),
            columns.map((column) => /* @__PURE__ */ jsx("td", { children: row[column.key] }, column.key))
          ] }),
          /* @__PURE__ */ jsx("tr", { id: `${id}-${index}`, hidden: !expanded, children: /* @__PURE__ */ jsx("td", { colSpan: columns.length + 1, children: row.details }) })
        ] }, row.id);
      }),
      !rows.length && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: columns.length + 1, children: "Aucune ligne." }) })
    ] })
  ] }) });
}
export {
  ExpandableTable
};
