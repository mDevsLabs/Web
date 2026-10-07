"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function DescriptionList({ items, className, ...props }) {
  return /* @__PURE__ */ jsx("dl", { ...props, className: cx("md-description-list", className), children: items.map((item, i) => /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("dt", { children: item.label }),
    /* @__PURE__ */ jsx("dd", { children: item.value })
  ] }, i)) });
}
export {
  DescriptionList
};
