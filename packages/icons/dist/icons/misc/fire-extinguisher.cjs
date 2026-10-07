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
var fire_extinguisher_exports = {};
__export(fire_extinguisher_exports, {
  FireExtinguisherIcon: () => FireExtinguisherIcon
});
module.exports = __toCommonJS(fire_extinguisher_exports);
var import_create_icon = require("../../create-icon.cjs");
const FireExtinguisherIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FireExtinguisherIcon", [["path", { "d": "M15 6.5V3a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v3.5" }], ["path", { "d": "M9 18h8" }], ["path", { "d": "M18 3h-3" }], ["path", { "d": "M11 3a6 6 0 0 0-6 6v11" }], ["path", { "d": "M5 13h4" }], ["path", { "d": "M17 10a4 4 0 0 0-8 0v10a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2Z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FireExtinguisherIcon
});
