"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { useControllable } from "../internal/utils.js";
function Rating({ value, defaultValue = 0, onValueChange, max = 5, label, disabled }) {
  const [current, update] = useControllable(value, defaultValue, onValueChange);
  const id = useId();
  const count = Math.max(1, Math.min(10, Math.floor(max)));
  return /* @__PURE__ */ jsxs("fieldset", { disabled, className: "md-fieldset md-rating", children: [
    /* @__PURE__ */ jsx("legend", { children: label }),
    Array.from({ length: count }, (_, i) => /* @__PURE__ */ jsxs("label", { title: `${i + 1} / ${count}`, children: [
      /* @__PURE__ */ jsx("input", { type: "radio", name: id, value: i + 1, checked: current === i + 1, onChange: () => update(i + 1), "aria-label": `${i + 1} / ${count}` }),
      /* @__PURE__ */ jsx("span", { "aria-hidden": "true", "data-filled": current >= i + 1, children: "\u2605" })
    ] }, i))
  ] });
}
export {
  Rating
};
