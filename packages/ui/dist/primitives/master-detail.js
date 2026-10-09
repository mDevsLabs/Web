"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { cx } from "../internal/utils.js";
function MasterDetail({ items, selectedId, onSelectionChange, children, label, emptyMessage = "S\xE9lectionnez un \xE9l\xE9ment.", className, ...props }) {
  const id = useId();
  return /* @__PURE__ */ jsxs("div", { ...props, className: cx("md-master-detail", className), children: [
    /* @__PURE__ */ jsxs("section", { "aria-labelledby": `${id}-list`, children: [
      /* @__PURE__ */ jsx("h2", { id: `${id}-list`, children: label }),
      /* @__PURE__ */ jsx("ul", { children: items.map((item) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("button", { type: "button", className: "md-master-item", "aria-pressed": selectedId === item.id, onClick: () => onSelectionChange(item.id), children: [
        /* @__PURE__ */ jsx("strong", { children: item.label }),
        item.description && /* @__PURE__ */ jsx("span", { className: "md-muted", children: item.description })
      ] }) }, item.id)) })
    ] }),
    /* @__PURE__ */ jsx("section", { "aria-label": "D\xE9tails de la s\xE9lection", "aria-live": "polite", children: selectedId ? children : /* @__PURE__ */ jsx("p", { className: "md-muted", children: emptyMessage }) })
  ] });
}
export {
  MasterDetail
};
