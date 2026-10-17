"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function Form({ onValuesSubmit, onSubmit, className, ...props }) {
  return /* @__PURE__ */ jsx("form", { ...props, className: cx("md-form-grid", className), onSubmit: (e) => {
    onSubmit?.(e);
    if (!e.defaultPrevented && onValuesSubmit) {
      e.preventDefault();
      onValuesSubmit(new FormData(e.currentTarget));
    }
  } });
}
export {
  Form
};
