"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { cx } from "../internal/utils.js";
function BarChart({ title, items, unit = "", className, ...props }) {
  const id = useId();
  const maximum = Math.max(1, ...items.map((item) => Number.isFinite(item.value) ? Math.max(0, item.value) : 0));
  return /* @__PURE__ */ jsxs("figure", { ...props, className: cx("md-bar-chart", className), "aria-labelledby": id, children: [
    /* @__PURE__ */ jsx("figcaption", { id, children: title }),
    /* @__PURE__ */ jsx("dl", { children: items.map((item) => /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("dt", { children: item.label }),
      /* @__PURE__ */ jsxs("dd", { children: [
        /* @__PURE__ */ jsxs("span", { children: [
          item.value,
          unit && ` ${unit}`
        ] }),
        /* @__PURE__ */ jsx("span", { className: "md-chart-track", "aria-hidden": "true", children: /* @__PURE__ */ jsx("span", { style: { width: `${Math.max(0, Math.min(100, Number.isFinite(item.value) ? item.value / maximum * 100 : 0))}%` } }) })
      ] })
    ] }, item.id)) })
  ] });
}
export {
  BarChart
};
