"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { cx } from "../internal/utils.js";
function GlassCard({ title, description, footer, actions, children, className, ...props }) {
  const id = useId();
  return /* @__PURE__ */ jsxs("article", { ...props, "aria-labelledby": typeof title === "string" ? id : void 0, className: cx("md-glass md-card", className), children: [
    (title || description || actions) && /* @__PURE__ */ jsxs("header", { className: "md-domain-heading", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        title && /* @__PURE__ */ jsx("h3", { id, children: title }),
        description && /* @__PURE__ */ jsx("p", { className: "md-muted", children: description })
      ] }),
      actions
    ] }),
    /* @__PURE__ */ jsx("div", { children }),
    footer && /* @__PURE__ */ jsx("footer", { className: "md-card-footer", children: footer })
  ] });
}
export {
  GlassCard
};
