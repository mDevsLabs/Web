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
var biohazard_exports = {};
__export(biohazard_exports, {
  BiohazardIcon: () => BiohazardIcon
});
module.exports = __toCommonJS(biohazard_exports);
var import_create_icon = require("../../create-icon.cjs");
const BiohazardIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BiohazardIcon", [["circle", { "cx": "12", "cy": "11.9", "r": "2" }], ["path", { "d": "M6.7 3.4c-.9 2.5 0 5.2 2.2 6.7C6.5 9 3.7 9.6 2 11.6" }], ["path", { "d": "m8.9 10.1 1.4.8" }], ["path", { "d": "M17.3 3.4c.9 2.5 0 5.2-2.2 6.7 2.4-1.2 5.2-.6 6.9 1.5" }], ["path", { "d": "m15.1 10.1-1.4.8" }], ["path", { "d": "M16.7 20.8c-2.6-.4-4.6-2.6-4.7-5.3-.2 2.6-2.1 4.8-4.7 5.2" }], ["path", { "d": "M12 13.9v1.6" }], ["path", { "d": "M13.5 5.4c-1-.2-2-.2-3 0" }], ["path", { "d": "M17 16.4c.7-.7 1.2-1.6 1.5-2.5" }], ["path", { "d": "M5.5 13.9c.3.9.8 1.8 1.5 2.5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BiohazardIcon
});
