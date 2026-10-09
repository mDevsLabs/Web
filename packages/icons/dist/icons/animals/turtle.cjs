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
var turtle_exports = {};
__export(turtle_exports, {
  TurtleIcon: () => TurtleIcon
});
module.exports = __toCommonJS(turtle_exports);
var import_create_icon = require("../../create-icon.js");
const TurtleIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TurtleIcon", [["path", { "d": "m12 10 2 4v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3a8 8 0 1 0-16 0v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3l2-4h4Z" }], ["path", { "d": "M4.82 7.9 8 10" }], ["path", { "d": "M15.18 7.9 12 10" }], ["path", { "d": "M16.93 10H20a2 2 0 0 1 0 4H2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TurtleIcon
});
