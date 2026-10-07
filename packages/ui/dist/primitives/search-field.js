"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId, useRef } from "react";
function SearchField({ label, value, onValueChange, onSearch, pending = false, placeholder = "Rechercher\u2026", className, ...props }) {
  const id = useId();
  const input = useRef(null);
  return /* @__PURE__ */ jsx("div", { ...props, className, children: /* @__PURE__ */ jsx("form", { role: "search", "aria-label": label, onSubmit: (event) => {
    event.preventDefault();
    if (!pending)
      onSearch(value.trim());
  }, children: /* @__PURE__ */ jsxs("label", { className: "md-field", htmlFor: id, children: [
    label,
    /* @__PURE__ */ jsxs("span", { className: "md-input-group", children: [
      /* @__PURE__ */ jsx("input", { ref: input, id, className: "md-input", type: "search", value, placeholder, disabled: pending, onChange: (event) => onValueChange(event.target.value) }),
      /* @__PURE__ */ jsx("button", { type: "submit", className: "md-button", disabled: pending, children: "Rechercher" }),
      value && /* @__PURE__ */ jsx("button", { type: "button", className: "md-button md-button-ghost", disabled: pending, "aria-label": "Effacer la recherche", onClick: () => {
        onValueChange("");
        input.current?.focus();
      }, children: "Effacer" })
    ] })
  ] }) }) });
}
export {
  SearchField
};
