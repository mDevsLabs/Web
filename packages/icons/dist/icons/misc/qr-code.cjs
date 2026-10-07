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
var qr_code_exports = {};
__export(qr_code_exports, {
  QrCodeIcon: () => QrCodeIcon
});
module.exports = __toCommonJS(qr_code_exports);
var import_create_icon = require("../../create-icon.cjs");
const QrCodeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("QrCodeIcon", [["rect", { "width": "5", "height": "5", "x": "3", "y": "3", "rx": "1" }], ["rect", { "width": "5", "height": "5", "x": "16", "y": "3", "rx": "1" }], ["rect", { "width": "5", "height": "5", "x": "3", "y": "16", "rx": "1" }], ["path", { "d": "M21 16h-3a2 2 0 0 0-2 2v3" }], ["path", { "d": "M21 21v.01" }], ["path", { "d": "M12 7v3a2 2 0 0 1-2 2H7" }], ["path", { "d": "M3 12h.01" }], ["path", { "d": "M12 3h.01" }], ["path", { "d": "M12 16v.01" }], ["path", { "d": "M16 12h1" }], ["path", { "d": "M21 12v.01" }], ["path", { "d": "M12 21v-1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  QrCodeIcon
});
