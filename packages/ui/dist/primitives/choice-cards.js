"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
function ChoiceCards({ label, options, value, onValueChange, disabled, className, ...props }) {
  const name = useId();
  return /* @__PURE__ */ jsx("div", { ...props, className, children: /* @__PURE__ */ jsxs("fieldset", { className: "md-form-section", disabled, children: [
    /* @__PURE__ */ jsx("legend", { children: label }),
    /* @__PURE__ */ jsx("div", { className: "md-choice-cards", children: options.map((option) => /* @__PURE__ */ jsxs("label", { className: "md-choice-card", "data-selected": value === option.value || void 0, children: [
      /* @__PURE__ */ jsx("input", { type: "radio", name, value: option.value, checked: value === option.value, disabled: option.disabled, onChange: () => onValueChange(option.value) }),
      /* @__PURE__ */ jsxs("span", { children: [
        /* @__PURE__ */ jsx("strong", { children: option.label }),
        option.description && /* @__PURE__ */ jsx("span", { className: "md-muted", children: option.description })
      ] })
    ] }, option.value)) })
  ] }) });
}
export {
  ChoiceCards
};
