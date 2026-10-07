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
var bento_grid_exports = {};
__export(bento_grid_exports, {
  BentoGrid: () => BentoGrid
});
module.exports = __toCommonJS(bento_grid_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function BentoGrid({ items, className, ...props }) {
  const prefix = (0, import_react.useId)();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ...props, className: (0, import_utils.cx)("md-bento-grid", className), children: items.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "md-glass md-pad-md", "data-span": item.span ?? 1, "aria-labelledby": `${prefix}-${index}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { id: `${prefix}-${index}`, children: item.title }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: item.content })
  ] }, item.id)) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BentoGrid
});
