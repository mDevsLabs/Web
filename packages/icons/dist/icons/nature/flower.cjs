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
var flower_exports = {};
__export(flower_exports, {
  FlowerIcon: () => FlowerIcon
});
module.exports = __toCommonJS(flower_exports);
var import_create_icon = require("../../create-icon.cjs");
const FlowerIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FlowerIcon", [["circle", { "cx": "12", "cy": "12", "r": "3" }], ["path", { "d": "M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5" }], ["path", { "d": "M12 7.5V9" }], ["path", { "d": "M7.5 12H9" }], ["path", { "d": "M16.5 12H15" }], ["path", { "d": "M12 16.5V15" }], ["path", { "d": "m8 8 1.88 1.88" }], ["path", { "d": "M14.12 9.88 16 8" }], ["path", { "d": "m8 16 1.88-1.88" }], ["path", { "d": "M14.12 14.12 16 16" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FlowerIcon
});
