"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function SkipLink({ targetId = "main-content", children = "Aller au contenu", className, ...props }) {
  return /* @__PURE__ */ jsx("a", { ...props, href: `#${encodeURIComponent(targetId)}`, className: cx("md-skip-link", className), children });
}
export {
  SkipLink
};
