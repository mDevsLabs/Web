"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
function TreeView({ nodes, onSelect, label }) {
  function branch(items) {
    return /* @__PURE__ */ jsx("ul", { className: "md-tree", children: items.map((node) => /* @__PURE__ */ jsx("li", { children: node.children?.length ? /* @__PURE__ */ jsxs("details", { children: [
      /* @__PURE__ */ jsx("summary", { children: node.label }),
      branch(node.children)
    ] }) : onSelect ? /* @__PURE__ */ jsx("button", { type: "button", className: "md-button md-button-ghost", onClick: () => onSelect(node), children: node.label }) : /* @__PURE__ */ jsx("span", { children: node.label }) }, node.id)) });
  }
  return /* @__PURE__ */ jsx("nav", { "aria-label": label, children: branch(nodes) });
}
export {
  TreeView
};
