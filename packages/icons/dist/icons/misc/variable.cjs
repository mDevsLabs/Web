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
var variable_exports = {};
__export(variable_exports, {
  VariableIcon: () => VariableIcon
});
module.exports = __toCommonJS(variable_exports);
var import_create_icon = require("../../create-icon.cjs");
const VariableIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("VariableIcon", [["path", { "d": "M8 21s-4-3-4-9 4-9 4-9" }], ["path", { "d": "M16 3s4 3 4 9-4 9-4 9" }], ["line", { "x1": "15", "x2": "9", "y1": "9", "y2": "15" }], ["line", { "x1": "9", "x2": "15", "y1": "9", "y2": "15" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  VariableIcon
});
