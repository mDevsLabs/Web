"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useId, useRef } from "react";
function FieldArray({ label, value, onValueChange, maxItems = 20, disabled, className, ...props }) {
  const prefix = useId();
  const sequence = useRef(0);
  const addButton = useRef(null);
  const focusAfterRemoval = useRef(false);
  useEffect(() => {
    if (focusAfterRemoval.current) {
      focusAfterRemoval.current = false;
      addButton.current?.focus();
    }
  }, [value.length]);
  const add = () => {
    let id;
    do {
      id = `${prefix}-${sequence.current++}`;
    } while (value.some((row) => row.id === id));
    onValueChange([...value, { id, value: "" }]);
  };
  return /* @__PURE__ */ jsx("div", { ...props, className, children: /* @__PURE__ */ jsxs("fieldset", { className: "md-form-section", disabled, children: [
    /* @__PURE__ */ jsx("legend", { children: label }),
    /* @__PURE__ */ jsx("div", { className: "md-stack", children: value.map((row, index) => /* @__PURE__ */ jsxs("div", { className: "md-input-group", children: [
      /* @__PURE__ */ jsx("input", { className: "md-input", "aria-label": `${label} ${index + 1}`, value: row.value, onChange: (event) => onValueChange(value.map((item) => item.id === row.id ? { ...item, value: event.target.value } : item)) }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "md-button md-button-outline", "aria-label": `Supprimer ${label} ${index + 1}`, onClick: () => {
        focusAfterRemoval.current = true;
        onValueChange(value.filter((item) => item.id !== row.id));
      }, children: "Supprimer" })
    ] }, row.id)) }),
    /* @__PURE__ */ jsx("button", { ref: addButton, type: "button", className: "md-button md-button-soft", disabled: value.length >= maxItems, onClick: add, children: "Ajouter" })
  ] }) });
}
export {
  FieldArray
};
