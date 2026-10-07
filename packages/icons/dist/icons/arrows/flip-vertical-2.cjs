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
var flip_vertical_2_exports = {};
__export(flip_vertical_2_exports, {
  FlipVertical2Icon: () => FlipVertical2Icon
});
module.exports = __toCommonJS(flip_vertical_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const FlipVertical2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FlipVertical2Icon", [["path", { "d": "M12 14v2" }], ["path", { "d": "M12 20v2" }], ["path", { "d": "M12 2v2" }], ["path", { "d": "M12 8v2" }], ["path", { "d": "M20.288 16.703A1 1 0 0022 16V8a1 1 0 00-1.712-.703l-3.99 3.991a1 1 0 00-.001 1.424z" }], ["path", { "d": "M3.712 16.703A1 1 0 012 16V8a1 1 0 011.712-.703l3.99 3.991a1 1 0 01.001 1.424z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FlipVertical2Icon
});
