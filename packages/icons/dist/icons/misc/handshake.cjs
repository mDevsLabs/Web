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
var handshake_exports = {};
__export(handshake_exports, {
  HandshakeIcon: () => HandshakeIcon
});
module.exports = __toCommonJS(handshake_exports);
var import_create_icon = require("../../create-icon.cjs");
const HandshakeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("HandshakeIcon", [["path", { "d": "m11 17 2 2a1 1 0 1 0 3-3" }], ["path", { "d": "m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" }], ["path", { "d": "m21 3 1 11h-2" }], ["path", { "d": "M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" }], ["path", { "d": "M3 4h8" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HandshakeIcon
});
