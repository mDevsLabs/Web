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
var baby_carriage_exports = {};
__export(baby_carriage_exports, {
  BabyCarriageIcon: () => BabyCarriageIcon
});
module.exports = __toCommonJS(baby_carriage_exports);
var import_create_icon = require("../../create-icon.cjs");
const BabyCarriageIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BabyCarriageIcon", [["path", { "d": "M6 19a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M16 19a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M2 5h2.5l1.632 4.897a6 6 0 0 0 5.693 4.103h2.675a5.5 5.5 0 0 0 0 -11h-.5v6" }], ["path", { "d": "M6 9h14" }], ["path", { "d": "M9 17l1 -3" }], ["path", { "d": "M16 14l1 3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BabyCarriageIcon
});
