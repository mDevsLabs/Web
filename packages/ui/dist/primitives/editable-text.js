"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useId, useRef, useState } from "react";
import { cx } from "../internal/utils.js";
function EditableText({ label, value, onCommit, disabled, emptyLabel = "Ajouter un texte", className, ...props }) {
  const id = useId();
  const button = useRef(null);
  const input = useRef(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const wasEditing = useRef(false);
  useEffect(() => {
    if (editing)
      input.current?.focus();
    else if (wasEditing.current)
      button.current?.focus();
    wasEditing.current = editing;
  }, [editing]);
  const close = () => setEditing(false);
  return /* @__PURE__ */ jsx("div", { ...props, className: cx("md-editable-text", className), children: editing ? /* @__PURE__ */ jsxs("form", { onSubmit: (event) => {
    event.preventDefault();
    onCommit(draft.trim());
    close();
  }, children: [
    /* @__PURE__ */ jsxs("label", { className: "md-field", htmlFor: id, children: [
      label,
      /* @__PURE__ */ jsx("input", { ref: input, id, className: "md-input", value: draft, onChange: (event) => setDraft(event.target.value), onKeyDown: (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          close();
        }
      } })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "md-cluster", children: [
      /* @__PURE__ */ jsx("button", { type: "submit", className: "md-button", children: "Valider" }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "md-button md-button-outline", onClick: close, children: "Annuler" })
    ] })
  ] }) : /* @__PURE__ */ jsx("button", { ref: button, className: "md-button md-button-ghost", type: "button", disabled, "aria-label": `Modifier : ${label}`, onClick: () => {
    setDraft(value);
    setEditing(true);
  }, children: value || emptyLabel }) });
}
export {
  EditableText
};
