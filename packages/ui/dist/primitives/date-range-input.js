"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
function DateRangeInput({ label, value, onValueChange, min, max, required, disabled, className, ...props }) {
  const id = useId();
  return /* @__PURE__ */ jsx("div", { ...props, className, children: /* @__PURE__ */ jsxs("fieldset", { className: "md-form-section", disabled, children: [
    /* @__PURE__ */ jsx("legend", { children: label }),
    /* @__PURE__ */ jsxs("div", { className: "md-grid", children: [
      /* @__PURE__ */ jsxs("label", { className: "md-field", htmlFor: `${id}-start`, children: [
        "D\xE9but",
        /* @__PURE__ */ jsx("input", { id: `${id}-start`, className: "md-input", type: "date", value: value.start, min, max: value.end || max, required, onChange: (event) => onValueChange({ ...value, start: event.target.value }) })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "md-field", htmlFor: `${id}-end`, children: [
        "Fin",
        /* @__PURE__ */ jsx("input", { id: `${id}-end`, className: "md-input", type: "date", value: value.end, min: value.start || min, max, required, onChange: (event) => onValueChange({ ...value, end: event.target.value }) })
      ] })
    ] })
  ] }) });
}
export {
  DateRangeInput
};
