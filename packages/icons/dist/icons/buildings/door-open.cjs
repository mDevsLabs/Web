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
var door_open_exports = {};
__export(door_open_exports, {
  DoorOpenIcon: () => DoorOpenIcon
});
module.exports = __toCommonJS(door_open_exports);
var import_create_icon = require("../../create-icon.cjs");
const DoorOpenIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("DoorOpenIcon", [["path", { "d": "M10 21H2" }], ["path", { "d": "M10 3H7a2 2 0 00-2 2v16" }], ["path", { "d": "M14 12h.01" }], ["path", { "d": "M19 21V5a2 2 0 00-1.675-1.974l-6.163-1.013A1 1 0 0010 3v18a1 1 0 001.124.992z" }], ["path", { "d": "M22 21h-3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DoorOpenIcon
});
