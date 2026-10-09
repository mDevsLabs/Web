"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { cx } from "../internal/utils.js";
function OtpInput({ label, value, onValueChange, length = 6, id: givenId, className, ...props }) {
  const generated = useId();
  const id = givenId ?? generated;
  const count = Math.min(12, Math.max(1, Math.floor(length) || 6));
  return /* @__PURE__ */ jsxs("label", { className: "md-field", htmlFor: id, children: [
    label,
    /* @__PURE__ */ jsx("input", { ...props, id, className: cx("md-input md-otp", className), inputMode: "numeric", autoComplete: "one-time-code", pattern: `[0-9]{${count}}`, maxLength: count, value, onChange: (event) => onValueChange(event.target.value.replace(/[^0-9]/g, "").slice(0, count)) })
  ] });
}
export {
  OtpInput
};
