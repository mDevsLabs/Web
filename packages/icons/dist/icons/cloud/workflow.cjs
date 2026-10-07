"use client";
"use strict";
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
var workflow_exports = {};
__export(workflow_exports, {
  WorkflowIcon: () => WorkflowIcon
});
module.exports = __toCommonJS(workflow_exports);
var import_create_icon = require("../../create-icon.cjs");
const WorkflowIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("WorkflowIcon", [["rect", { "width": "8", "height": "8", "x": "3", "y": "3", "rx": "2" }], ["path", { "d": "M7 11v4a2 2 0 0 0 2 2h4" }], ["rect", { "width": "8", "height": "8", "x": "13", "y": "13", "rx": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  WorkflowIcon
});
