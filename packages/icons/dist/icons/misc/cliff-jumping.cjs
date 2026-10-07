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
var cliff_jumping_exports = {};
__export(cliff_jumping_exports, {
  CliffJumpingIcon: () => CliffJumpingIcon
});
module.exports = __toCommonJS(cliff_jumping_exports);
var import_create_icon = require("../../create-icon.cjs");
const CliffJumpingIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CliffJumpingIcon", [["path", { "d": "M10.5 18l2.5 2l2 -2" }], ["path", { "d": "M18 21l3 -3l-4 -2l-2 -5" }], ["path", { "d": "M9 8l3 3l3 1l4 -2l3 -2" }], ["path", { "d": "M3 21v-1l2 -3l.5 -2.5l1.5 -2.5l-1 -5l1 -3l-1 -1l-2 .5l-2 -.5" }], ["path", { "d": "M13.007 8a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CliffJumpingIcon
});
