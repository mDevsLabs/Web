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
var server_off_exports = {};
__export(server_off_exports, {
  ServerOffIcon: () => ServerOffIcon
});
module.exports = __toCommonJS(server_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const ServerOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ServerOffIcon", [["path", { "d": "M7 2h13a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-5" }], ["path", { "d": "M10 10 2.5 2.5C2 2 2 2.5 2 5v3a2 2 0 0 0 2 2h6z" }], ["path", { "d": "M22 17v-1a2 2 0 0 0-2-2h-1" }], ["path", { "d": "M4 14a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16.5l1-.5.5.5-8-8H4z" }], ["path", { "d": "M6 18h.01" }], ["path", { "d": "m2 2 20 20" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ServerOffIcon
});
