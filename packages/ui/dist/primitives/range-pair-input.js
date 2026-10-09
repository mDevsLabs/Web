"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
function RangePairInput({ label, value, onValueChange, min = 0, max = 100, step = 1, disabled, className, ...props }) {
  const id = useId();
  const upper = Math.max(min, max);
  const low = Math.max(min, Math.min(upper, Number.isFinite(value[0]) ? value[0] : min));
  const high = Math.max(low, Math.min(upper, Number.isFinite(value[1]) ? value[1] : upper));
  return /* @__PURE__ */ jsx("div", { ...props, className, children: /* @__PURE__ */ jsxs("fieldset", { className: "md-form-section", disabled, children: [
    /* @__PURE__ */ jsx("legend", { children: label }),
    /* @__PURE__ */ jsxs("label", { htmlFor: `${id}-low`, children: [
      "Minimum : ",
      low,
      /* @__PURE__ */ jsx("input", { id: `${id}-low`, type: "range", className: "md-range", min, max: high, step: step > 0 ? step : 1, value: low, onChange: (event) => onValueChange([event.target.valueAsNumber, high]) })
    ] }),
    /* @__PURE__ */ jsxs("label", { htmlFor: `${id}-high`, children: [
      "Maximum : ",
      high,
      /* @__PURE__ */ jsx("input", { id: `${id}-high`, type: "range", className: "md-range", min: low, max: upper, step: step > 0 ? step : 1, value: high, onChange: (event) => onValueChange([low, event.target.valueAsNumber]) })
    ] })
  ] }) });
}
export {
  RangePairInput
};
