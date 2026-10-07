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
var group_exports = {};
__export(group_exports, {
  GroupIcon: () => GroupIcon
});
module.exports = __toCommonJS(group_exports);
var import_create_icon = require("../../create-icon.cjs");
const GroupIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("GroupIcon", [["path", { "d": "M3 7V5c0-1.1.9-2 2-2h2" }], ["path", { "d": "M17 3h2c1.1 0 2 .9 2 2v2" }], ["path", { "d": "M21 17v2c0 1.1-.9 2-2 2h-2" }], ["path", { "d": "M7 21H5c-1.1 0-2-.9-2-2v-2" }], ["rect", { "width": "7", "height": "5", "x": "7", "y": "7", "rx": "1" }], ["rect", { "width": "7", "height": "5", "x": "10", "y": "12", "rx": "1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GroupIcon
});
