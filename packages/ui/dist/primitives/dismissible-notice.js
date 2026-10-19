"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { cx } from "../internal/utils.js";
function DismissibleNotice({ heading, children, onDismiss, tone = "neutral", className, ...props }) {
  const id = useId();
  return /* @__PURE__ */ jsxs("div", { ...props, role: tone === "danger" ? "alert" : "status", "aria-labelledby": id, className: cx("md-inline-notice md-glass", className), "data-tone": tone, children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("strong", { id, children: heading }),
      children && /* @__PURE__ */ jsx("div", { children })
    ] }),
    /* @__PURE__ */ jsx("button", { type: "button", className: "md-button md-button-ghost", "aria-label": `Fermer : ${heading}`, onClick: onDismiss, children: "\xD7" })
  ] });
}
export {
  DismissibleNotice
};
