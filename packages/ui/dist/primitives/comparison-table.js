"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function ComparisonTable({ caption, columns, features, className, ...props }) {
  return /* @__PURE__ */ jsx("div", { ...props, className: cx("md-table-wrap", className), role: "region", "aria-label": caption, tabIndex: 0, children: /* @__PURE__ */ jsxs("table", { className: "md-table", children: [
    /* @__PURE__ */ jsx("caption", { children: caption }),
    /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
      /* @__PURE__ */ jsx("th", { scope: "col", children: "Fonctionnalit\xE9" }),
      columns.map((column) => /* @__PURE__ */ jsx("th", { scope: "col", children: column.label }, column.id))
    ] }) }),
    /* @__PURE__ */ jsx("tbody", { children: features.map((feature) => /* @__PURE__ */ jsxs("tr", { children: [
      /* @__PURE__ */ jsx("th", { scope: "row", children: feature.label }),
      columns.map((column) => /* @__PURE__ */ jsx("td", { children: typeof feature.values[column.id] === "boolean" ? feature.values[column.id] ? "Inclus" : "Non inclus" : feature.values[column.id] ?? "\u2014" }, column.id))
    ] }, feature.id)) })
  ] }) });
}
export {
  ComparisonTable
};
