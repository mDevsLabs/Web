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
var logic_xnor_exports = {};
__export(logic_xnor_exports, {
  LogicXnorIcon: () => LogicXnorIcon
});
module.exports = __toCommonJS(logic_xnor_exports);
var import_create_icon = require("../../create-icon.cjs");
const LogicXnorIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("LogicXnorIcon", [["path", { "d": "M22 12h-2" }], ["path", { "d": "M2 9h4" }], ["path", { "d": "M2 15h4" }], ["path", { "d": "M5 19c1.778 -4.667 1.778 -9.333 0 -14" }], ["path", { "d": "M8 5c10.667 2.1 10.667 12.6 0 14c1.806 -4.667 1.806 -9.333 0 -14" }], ["path", { "d": "M16 12a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LogicXnorIcon
});
