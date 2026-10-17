"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { cx } from "../internal/utils.js";
function BentoGrid({ items, className, ...props }) {
  const prefix = useId();
  return /* @__PURE__ */ jsx("div", { ...props, className: cx("md-bento-grid", className), children: items.map((item, index) => /* @__PURE__ */ jsxs("section", { className: "md-glass md-pad-md", "data-span": item.span ?? 1, "aria-labelledby": `${prefix}-${index}`, children: [
    /* @__PURE__ */ jsx("h3", { id: `${prefix}-${index}`, children: item.title }),
    /* @__PURE__ */ jsx("div", { children: item.content })
  ] }, item.id)) });
}
export {
  BentoGrid
};
