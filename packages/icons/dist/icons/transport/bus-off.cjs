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
var bus_off_exports = {};
__export(bus_off_exports, {
  BusOffIcon: () => BusOffIcon
});
module.exports = __toCommonJS(bus_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const BusOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BusOffIcon", [["path", { "d": "M4 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M16.18 16.172a2 2 0 0 0 2.652 2.648" }], ["path", { "d": "M4 17h-2v-11a1 1 0 0 1 1 -1h2m4 0h8c2.761 0 5 3.134 5 7v5h-1m-5 0h-8" }], ["path", { "d": "M16 5l1.5 7h4.5" }], ["path", { "d": "M2 10h8m4 0h3" }], ["path", { "d": "M7 7v3" }], ["path", { "d": "M12 5v3" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BusOffIcon
});
