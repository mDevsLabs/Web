"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId, useRef } from "react";
function KeyValueEditor({ label, value, onValueChange, disabled, className, ...props }) {
  const prefix = useId();
  const sequence = useRef(0);
  const addButton = useRef(null);
  const update = (id, key, next) => onValueChange(value.map((row) => row.id === id ? { ...row, [key]: next } : row));
  return /* @__PURE__ */ jsx("div", { ...props, className, children: /* @__PURE__ */ jsxs("fieldset", { className: "md-form-section", disabled, children: [
    /* @__PURE__ */ jsx("legend", { children: label }),
    /* @__PURE__ */ jsx("div", { className: "md-stack", children: value.map((row, index) => {
      const duplicate = !!row.key.trim() && value.some((other) => other.id !== row.id && other.key.trim() === row.key.trim());
      const errorId = `${prefix}-${index}-error`;
      return /* @__PURE__ */ jsxs("div", { className: "md-key-value-row", children: [
        /* @__PURE__ */ jsxs("label", { className: "md-field", children: [
          "Cl\xE9 ",
          index + 1,
          /* @__PURE__ */ jsx("input", { className: "md-input", value: row.key, "aria-invalid": duplicate || void 0, "aria-describedby": duplicate ? errorId : void 0, onChange: (event) => update(row.id, "key", event.target.value) })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "md-field", children: [
          "Valeur ",
          index + 1,
          /* @__PURE__ */ jsx("input", { className: "md-input", value: row.value, onChange: (event) => update(row.id, "value", event.target.value) })
        ] }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "md-button md-button-outline", "aria-label": `Supprimer la paire ${index + 1}`, onClick: () => {
          onValueChange(value.filter((other) => other.id !== row.id));
          addButton.current?.focus();
        }, children: "Supprimer" }),
        duplicate && /* @__PURE__ */ jsx("p", { id: errorId, className: "md-field-error", children: "Cette cl\xE9 est d\xE9j\xE0 utilis\xE9e." })
      ] }, row.id);
    }) }),
    /* @__PURE__ */ jsx("button", { ref: addButton, type: "button", className: "md-button md-button-soft", onClick: () => {
      let id;
      do {
        id = `${prefix}-${sequence.current++}`;
      } while (value.some((row) => row.id === id));
      onValueChange([...value, { id, key: "", value: "" }]);
    }, children: "Ajouter une paire" })
  ] }) });
}
export {
  KeyValueEditor
};
