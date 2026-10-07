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
var bus_exports = {};
__export(bus_exports, {
  BusIcon: () => BusIcon
});
module.exports = __toCommonJS(bus_exports);
var import_create_icon = require("../../create-icon.cjs");
const BusIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BusIcon", [["path", { "d": "M8 6v6" }], ["path", { "d": "M15 6v6" }], ["path", { "d": "M2 12h19.6" }], ["path", { "d": "M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3" }], ["circle", { "cx": "7", "cy": "18", "r": "2" }], ["path", { "d": "M9 18h5" }], ["circle", { "cx": "16", "cy": "18", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BusIcon
});
