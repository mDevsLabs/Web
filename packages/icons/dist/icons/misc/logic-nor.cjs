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
var logic_nor_exports = {};
__export(logic_nor_exports, {
  LogicNorIcon: () => LogicNorIcon
});
module.exports = __toCommonJS(logic_nor_exports);
var import_create_icon = require("../../create-icon.cjs");
const LogicNorIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("LogicNorIcon", [["path", { "d": "M22 12h-4" }], ["path", { "d": "M2 9h5" }], ["path", { "d": "M2 15h5" }], ["path", { "d": "M6 5c10.667 2.1 10.667 12.6 0 14c1.806 -4.667 1.806 -9.333 0 -14" }], ["path", { "d": "M14 12a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LogicNorIcon
});
