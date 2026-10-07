"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId, useState } from "react";
function TagInput({ value, onValueChange, label, placeholder = "Ajouter une \xE9tiquette" }) {
  const [input, setInput] = useState("");
  const id = useId();
  return /* @__PURE__ */ jsxs("div", { className: "md-field", children: [
    /* @__PURE__ */ jsx("label", { htmlFor: id, children: label }),
    /* @__PURE__ */ jsxs("div", { className: "md-tags", children: [
      value.map((tag) => /* @__PURE__ */ jsxs("span", { className: "md-badge", children: [
        tag,
        /* @__PURE__ */ jsx("button", { type: "button", "aria-label": `Supprimer ${tag}`, onClick: () => onValueChange(value.filter((t) => t !== tag)), children: "\xD7" })
      ] }, tag)),
      /* @__PURE__ */ jsx("input", { id, className: "md-input", value: input, placeholder, onChange: (e) => setInput(e.target.value), onKeyDown: (e) => {
        if (e.key === "Enter" && !e.nativeEvent.isComposing) {
          e.preventDefault();
          const tag = input.trim();
          if (tag && !value.includes(tag))
            onValueChange([...value, tag]);
          setInput("");
        }
      } })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "md-muted", children: "Appuyez sur Entr\xE9e pour ajouter." })
  ] });
}
export {
  TagInput
};
