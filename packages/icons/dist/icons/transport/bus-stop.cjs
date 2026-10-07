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
var bus_stop_exports = {};
__export(bus_stop_exports, {
  BusStopIcon: () => BusStopIcon
});
module.exports = __toCommonJS(bus_stop_exports);
var import_create_icon = require("../../create-icon.cjs");
const BusStopIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BusStopIcon", [["path", { "d": "M3 4a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1l0 -4" }], ["path", { "d": "M16 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M10 5h7c2.761 0 5 3.134 5 7v5h-2" }], ["path", { "d": "M16 17h-8" }], ["path", { "d": "M16 5l1.5 7h4.5" }], ["path", { "d": "M9.5 10h7.5" }], ["path", { "d": "M12 5v5" }], ["path", { "d": "M5 9v11" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BusStopIcon
});
