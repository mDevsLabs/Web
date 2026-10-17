"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useId, useRef, useState } from "react";
import { cx } from "../internal/utils.js";
function Combobox({ label, options, value, onValueChange, disabled, placeholder = "Rechercher\u2026", emptyMessage = "Aucun choix disponible.", className, ...props }) {
  const id = useId();
  const input = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const available = options.filter((option) => option.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const selected = options.find((option) => option.value === value);
  const selectable = available.map((option, index) => option.disabled ? -1 : index).filter((index) => index >= 0);
  const highlighted = active >= 0 && !available[active]?.disabled ? available[active] : void 0;
  useEffect(() => {
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
  return /* @__PURE__ */ jsxs("div", { ...props, className: cx("md-field md-combobox", className), children: [
    /* @__PURE__ */ jsx("label", { htmlFor: id, children: label }),
    /* @__PURE__ */ jsx("input", { ref: input, id, className: "md-input", role: "combobox", autoComplete: "off", "aria-autocomplete": "list", "aria-expanded": open, "aria-controls": open ? `${id}-list` : void 0, "aria-activedescendant": open && highlighted ? `${id}-option-${active}` : void 0, disabled, value: open ? query : selected?.label ?? "", placeholder, onFocus: () => {
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
    open && /* @__PURE__ */ jsxs("div", { className: "md-combobox-popup md-glass", children: [
      /* @__PURE__ */ jsx("ul", { role: "listbox", id: `${id}-list`, "aria-label": label, children: available.map((option, index) => /* @__PURE__ */ jsx("li", { id: `${id}-option-${index}`, role: "option", "aria-selected": option.value === value, "aria-disabled": option.disabled || void 0, "data-active": active === index || void 0, onMouseDown: (event) => event.preventDefault(), onClick: () => {
        if (!option.disabled)
          choose(option.value);
      }, children: option.label }, option.value)) }),
      !available.length && /* @__PURE__ */ jsx("p", { role: "status", children: emptyMessage })
    ] })
  ] });
}
export {
  Combobox
};
