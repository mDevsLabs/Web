"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { cx } from "../internal/utils.js";
function CharacterCountTextarea({ label, value, onValueChange, maxLength = 500, id: givenId, "aria-describedby": describedBy, className, ...props }) {
  const generated = useId();
  const id = givenId ?? generated;
  const counter = `${id}-count`;
  return /* @__PURE__ */ jsxs("div", { className: "md-field", children: [
    /* @__PURE__ */ jsx("label", { htmlFor: id, children: label }),
    /* @__PURE__ */ jsx("textarea", { ...props, id, value, maxLength, onChange: (event) => onValueChange(event.target.value), "aria-describedby": [describedBy, counter].filter(Boolean).join(" "), className: cx("md-textarea", className) }),
    /* @__PURE__ */ jsxs("small", { id: counter, className: "md-muted", children: [
      value.length,
      " / ",
      maxLength,
      " caract\xE8res"
    ] })
  ] });
}
export {
  CharacterCountTextarea
};
