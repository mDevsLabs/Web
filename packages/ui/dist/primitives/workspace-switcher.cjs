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
var workspace_switcher_exports = {};
__export(workspace_switcher_exports, {
  WorkspaceSwitcher: () => WorkspaceSwitcher
});
module.exports = __toCommonJS(workspace_switcher_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function WorkspaceSwitcher({ label, workspaces, value, onValueChange, disabled, className, ...props }) {
  const id = (0, import_react.useId)();
  const current = workspaces.find((workspace) => workspace.id === value);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ...props, className: (0, import_utils.cx)("md-field md-workspace-switcher", className), children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { htmlFor: id, children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", { id, className: "md-select", value, disabled, "aria-describedby": current?.description ? `${id}-description` : void 0, onChange: (event) => onValueChange(event.target.value), children: workspaces.map((workspace) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: workspace.id, disabled: workspace.disabled, children: workspace.name }, workspace.id)) }),
    current?.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { id: `${id}-description`, className: "md-muted", children: current.description })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  WorkspaceSwitcher
});
