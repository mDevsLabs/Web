"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId, useState } from "react";
function DualListSelector({ label, options, value, onValueChange, disabled, className, ...props }) {
  const id = useId();
  const [left, setLeft] = useState([]);
  const [right, setRight] = useState([]);
  return /* @__PURE__ */ jsx("div", { ...props, className, children: /* @__PURE__ */ jsxs("fieldset", { className: "md-form-section", disabled, children: [
    /* @__PURE__ */ jsx("legend", { children: label }),
    /* @__PURE__ */ jsxs("div", { className: "md-transfer", children: [
      /* @__PURE__ */ jsxs("label", { htmlFor: `${id}-available`, children: [
        "Disponibles",
        /* @__PURE__ */ jsx("select", { id: `${id}-available`, className: "md-select", multiple: true, size: 5, value: left, onChange: (event) => setLeft(Array.from(event.target.selectedOptions, (option) => option.value)), children: options.filter((option) => !value.includes(option.value)).map((option) => /* @__PURE__ */ jsx("option", { value: option.value, children: option.label }, option.value)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "md-stack", children: [
        /* @__PURE__ */ jsx("button", { type: "button", className: "md-button md-button-outline", disabled: !left.length, onClick: () => {
          onValueChange([.../* @__PURE__ */ new Set([...value, ...left])]);
          setLeft([]);
        }, children: "Ajouter \u2192" }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "md-button md-button-outline", disabled: !right.length, onClick: () => {
          onValueChange(value.filter((item) => !right.includes(item)));
          setRight([]);
        }, children: "\u2190 Retirer" })
      ] }),
      /* @__PURE__ */ jsxs("label", { htmlFor: `${id}-selected`, children: [
        "S\xE9lectionn\xE9s",
        /* @__PURE__ */ jsx("select", { id: `${id}-selected`, className: "md-select", multiple: true, size: 5, value: right, onChange: (event) => setRight(Array.from(event.target.selectedOptions, (option) => option.value)), children: options.filter((option) => value.includes(option.value)).map((option) => /* @__PURE__ */ jsx("option", { value: option.value, children: option.label }, option.value)) })
      ] })
    ] })
  ] }) });
}
export {
  DualListSelector
};
