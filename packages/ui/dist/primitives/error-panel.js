"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { cx } from "../internal/utils.js";
function ErrorPanel({ heading, message, details, reference, className, ...props }) {
  const id = useId();
  return /* @__PURE__ */ jsxs("div", { ...props, role: "alert", "aria-labelledby": id, className: cx("md-error-panel md-glass md-pad-md", className), children: [
    /* @__PURE__ */ jsx("h3", { id, children: heading }),
    /* @__PURE__ */ jsx("p", { children: message }),
    reference && /* @__PURE__ */ jsxs("p", { className: "md-muted", children: [
      "R\xE9f\xE9rence : ",
      /* @__PURE__ */ jsx("code", { children: reference })
    ] }),
    details && /* @__PURE__ */ jsxs("details", { children: [
      /* @__PURE__ */ jsx("summary", { children: "D\xE9tails techniques" }),
      /* @__PURE__ */ jsx("pre", { children: details })
    ] })
  ] });
}
export {
  ErrorPanel
};
