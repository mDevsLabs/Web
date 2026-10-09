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
var master_detail_exports = {};
__export(master_detail_exports, {
  MasterDetail: () => MasterDetail
});
module.exports = __toCommonJS(master_detail_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function MasterDetail({ items, selectedId, onSelectionChange, children, label, emptyMessage = "S\xE9lectionnez un \xE9l\xE9ment.", className, ...props }) {
  const id = (0, import_react.useId)();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ...props, className: (0, import_utils.cx)("md-master-detail", className), children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { "aria-labelledby": `${id}-list`, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { id: `${id}-list`, children: label }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: "md-master-item", "aria-pressed": selectedId === item.id, onClick: () => onSelectionChange(item.id), children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: item.label }),
        item.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "md-muted", children: item.description })
      ] }) }, item.id)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", { "aria-label": "D\xE9tails de la s\xE9lection", "aria-live": "polite", children: selectedId ? children : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "md-muted", children: emptyMessage }) })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MasterDetail
});
