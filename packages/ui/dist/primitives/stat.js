"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function Stat({ label, value, change, tone = "neutral", className, ...props }) {
  return /* @__PURE__ */ jsxs("div", { ...props, className: cx("md-glass md-stat", className), "data-tone": tone, children: [
    /* @__PURE__ */ jsxs("dl", { children: [
      /* @__PURE__ */ jsx("dt", { children: label }),
      /* @__PURE__ */ jsx("dd", { children: value })
    ] }),
    change && /* @__PURE__ */ jsx("p", { children: change })
  ] });
}
export {
  Stat
};
