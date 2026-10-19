"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function Stepper({ steps, currentStep, className, ...props }) {
  return /* @__PURE__ */ jsx("ol", { ...props, className: cx("md-stepper", className), children: steps.map((step, i) => /* @__PURE__ */ jsxs("li", { "aria-current": i === currentStep ? "step" : void 0, "data-complete": i < currentStep || void 0, children: [
    /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: i < currentStep ? "\u2713" : i + 1 }),
    /* @__PURE__ */ jsx("span", { children: step }),
    i < currentStep && /* @__PURE__ */ jsx("span", { className: "md-sr-only", children: " termin\xE9" })
  ] }, i)) });
}
export {
  Stepper
};
