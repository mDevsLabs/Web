"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function PageHeader({ title, description, breadcrumbs, actions, headingLevel = 1, className, ...props }) {
  const HeadingTag = headingLevel === 1 ? "h1" : "h2";
  return /* @__PURE__ */ jsxs("header", { ...props, className: cx("md-page-header", className), children: [
    breadcrumbs,
    /* @__PURE__ */ jsxs("div", { className: "md-page-title", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(HeadingTag, { children: title }),
        description && /* @__PURE__ */ jsx("p", { className: "md-muted", children: description })
      ] }),
      actions && /* @__PURE__ */ jsx("div", { className: "md-cluster", children: actions })
    ] })
  ] });
}
export {
  PageHeader
};
