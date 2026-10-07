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
var eject_exports = {};
__export(eject_exports, {
  EjectIcon: () => EjectIcon
});
module.exports = __toCommonJS(eject_exports);
var import_create_icon = require("../../create-icon.cjs");
const EjectIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("EjectIcon", [["path", { "d": "M4 13a1 1 0 0 1-.72-1.695l7.257-7.668a2 2 0 0 1 2.926 0l7.256 7.668A1 1 0 0 1 20 13z" }], ["rect", { "x": "3", "y": "17", "width": "18", "height": "4", "rx": "1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EjectIcon
});
