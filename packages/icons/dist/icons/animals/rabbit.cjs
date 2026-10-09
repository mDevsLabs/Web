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
var rabbit_exports = {};
__export(rabbit_exports, {
  RabbitIcon: () => RabbitIcon
});
module.exports = __toCommonJS(rabbit_exports);
var import_create_icon = require("../../create-icon.js");
const RabbitIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("RabbitIcon", [["path", { "d": "M13 16a3 3 0 0 1 2.24 5" }], ["path", { "d": "M18 12h.01" }], ["path", { "d": "M18 21h-8a4 4 0 0 1-4-4 7 7 0 0 1 7-7h.2L9.6 6.4a1 1 0 1 1 2.8-2.8L15.8 7h.2c3.3 0 6 2.7 6 6v1a2 2 0 0 1-2 2h-1a3 3 0 0 0-3 3" }], ["path", { "d": "M20 8.54V4a2 2 0 1 0-4 0v3" }], ["path", { "d": "M7.612 12.524a3 3 0 1 0-1.6 4.3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RabbitIcon
});
