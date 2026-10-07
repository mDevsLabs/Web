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
var tree_view_exports = {};
__export(tree_view_exports, {
  TreeView: () => TreeView
});
module.exports = __toCommonJS(tree_view_exports);
var import_jsx_runtime = require("react/jsx-runtime");
function TreeView({ nodes, onSelect, label }) {
  function branch(items) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { className: "md-tree", children: items.map((node) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: node.children?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", { children: node.label }),
      branch(node.children)
    ] }) : onSelect ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "md-button md-button-ghost", onClick: () => onSelect(node), children: node.label }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: node.label }) }, node.id)) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", { "aria-label": label, children: branch(nodes) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TreeView
});
