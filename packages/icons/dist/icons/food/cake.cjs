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
var cake_exports = {};
__export(cake_exports, {
  CakeIcon: () => CakeIcon
});
module.exports = __toCommonJS(cake_exports);
var import_create_icon = require("../../create-icon.cjs");
const CakeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CakeIcon", [["path", { "d": "M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" }], ["path", { "d": "M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1" }], ["path", { "d": "M2 21h20" }], ["path", { "d": "M7 8v3" }], ["path", { "d": "M12 8v3" }], ["path", { "d": "M17 8v3" }], ["path", { "d": "M7 4h.01" }], ["path", { "d": "M12 4h.01" }], ["path", { "d": "M17 4h.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CakeIcon
});
