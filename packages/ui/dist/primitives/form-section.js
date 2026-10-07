"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { cx } from "../internal/utils.js";
function FormSection({ legend, hint, children, className, ...props }) {
  const id = useId();
  return /* @__PURE__ */ jsxs("fieldset", { ...props, className: cx("md-form-section", className), "aria-describedby": hint ? id : void 0, children: [
    /* @__PURE__ */ jsx("legend", { children: legend }),
    hint && /* @__PURE__ */ jsx("p", { id, className: "md-muted", children: hint }),
    /* @__PURE__ */ jsx("div", { className: "md-stack", children })
  ] });
}
export {
  FormSection
};
