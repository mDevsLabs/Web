"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { cx } from "../internal/utils.js";
function DataTable({ columns, rows, getRowKey, caption, emptyMessage = "Aucun r\xE9sultat.", className }) {
  const [sort, setSort] = useState(null);
  const ordered = useMemo(() => sort ? [...rows].sort((a, b) => {
    const x = a[sort.key], y = b[sort.key];
    const n = typeof x === "number" && typeof y === "number" ? x - y : String(x ?? "").localeCompare(String(y ?? ""), void 0, { numeric: true });
    return sort.asc ? n : -n;
  }) : rows, [rows, sort]);
  return /* @__PURE__ */ jsx("div", { className: cx("md-table-scroll", className), role: "region", "aria-label": caption, tabIndex: 0, children: /* @__PURE__ */ jsxs("table", { className: "md-table", children: [
    /* @__PURE__ */ jsx("caption", { children: caption }),
    /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { children: columns.map((c) => /* @__PURE__ */ jsx("th", { scope: "col", "aria-sort": sort?.key === c.key ? sort.asc ? "ascending" : "descending" : void 0, children: c.sortable ? /* @__PURE__ */ jsxs("button", { type: "button", className: "md-sort", onClick: () => setSort({ key: c.key, asc: sort?.key === c.key ? !sort.asc : true }), children: [
      c.label,
      /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: " \u2195" })
    ] }) : c.label }, c.key)) }) }),
    /* @__PURE__ */ jsx("tbody", { children: ordered.length ? ordered.map((row) => /* @__PURE__ */ jsx("tr", { children: columns.map((c) => /* @__PURE__ */ jsx("td", { children: c.render ? c.render(row[c.key], row) : String(row[c.key] ?? "\u2014") }, c.key)) }, getRowKey(row))) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: columns.length, children: emptyMessage }) }) })
  ] }) });
}
export {
  DataTable
};
