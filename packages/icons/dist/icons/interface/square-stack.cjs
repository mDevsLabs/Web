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
var square_stack_exports = {};
__export(square_stack_exports, {
  SquareStackIcon: () => SquareStackIcon
});
module.exports = __toCommonJS(square_stack_exports);
var import_create_icon = require("../../create-icon.cjs");
const SquareStackIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SquareStackIcon", [["path", { "d": "M4 10c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2" }], ["path", { "d": "M10 16c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2" }], ["rect", { "width": "8", "height": "8", "x": "14", "y": "14", "rx": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SquareStackIcon
});
