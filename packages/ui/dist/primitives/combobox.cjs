"use client";
"use strict";
"use client";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var combobox_exports = {};
__export(combobox_exports, {
  Combobox: () => Combobox
});
module.exports = __toCommonJS(combobox_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function Combobox({ label, options, value, onValueChange, disabled, placeholder = "Rechercher\u2026", emptyMessage = "Aucun choix disponible.", className, ...props }) {
  const id = (0, import_react.useId)();
  const input = (0, import_react.useRef)(null);
  const [open, setOpen] = (0, import_react.useState)(false);
  const [query, setQuery] = (0, import_react.useState)("");
  const [active, setActive] = (0, import_react.useState)(-1);
  const available = options.filter((option) => option.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const selected = options.find((option) => option.value === value);
  const selectable = available.map((option, index) => option.disabled ? -1 : index).filter((index) => index >= 0);
  const highlighted = active >= 0 && !available[active]?.disabled ? available[active] : void 0;
  (0, import_react.useEffect)(() => {
    if (disabled) {
      setOpen(false);
      setQuery("");
      setActive(-1);
    }
  }, [disabled]);
  const choose = (next) => {
    if (disabled)
      return;
    onValueChange(next);
    setOpen(false);
    setQuery("");
    setActive(-1);
    input.current?.focus();
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ...props, className: (0, import_utils.cx)("md-field md-combobox", className), children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { htmlFor: id, children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ref: input, id, className: "md-input", role: "combobox", autoComplete: "off", "aria-autocomplete": "list", "aria-expanded": open, "aria-controls": open ? `${id}-list` : void 0, "aria-activedescendant": open && highlighted ? `${id}-option-${active}` : void 0, disabled, value: open ? query : selected?.label ?? "", placeholder, onFocus: () => {
      setOpen(true);
      setQuery("");
      setActive(-1);
    }, onBlur: (event) => {
      if (!event.currentTarget.parentElement?.contains(event.relatedTarget)) {
        setOpen(false);
        setQuery("");
        setActive(-1);
      }
    }, onChange: (event) => {
      setQuery(event.target.value);
      setOpen(true);
      setActive(-1);
    }, onKeyDown: (event) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setOpen(true);
        if (selectable.length) {
          const position = selectable.indexOf(active);
          const next = event.key === "ArrowDown" ? (position + 1) % selectable.length : position < 0 ? selectable.length - 1 : (position - 1 + selectable.length) % selectable.length;
          setActive(selectable[next]);
        }
      } else if (event.key === "Enter" && open) {
        event.preventDefault();
        if (highlighted)
          choose(highlighted.value);
      } else if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        setQuery("");
        setActive(-1);
      }
    } }),
    open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "md-combobox-popup md-glass", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { role: "listbox", id: `${id}-list`, "aria-label": label, children: available.map((option, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { id: `${id}-option-${index}`, role: "option", "aria-selected": option.value === value, "aria-disabled": option.disabled || void 0, "data-active": active === index || void 0, onMouseDown: (event) => event.preventDefault(), onClick: () => {
        if (!option.disabled)
          choose(option.value);
      }, children: option.label }, option.value)) }),
      !available.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { role: "status", children: emptyMessage })
    ] })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Combobox
});
