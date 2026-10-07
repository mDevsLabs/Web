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
var shrink_exports = {};
__export(shrink_exports, {
  ShrinkIcon: () => ShrinkIcon
});
module.exports = __toCommonJS(shrink_exports);
var import_create_icon = require("../../create-icon.cjs");
const ShrinkIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ShrinkIcon", [["path", { "d": "m15 15 6 6m-6-6v4.8m0-4.8h4.8" }], ["path", { "d": "M9 19.8V15m0 0H4.2M9 15l-6 6" }], ["path", { "d": "M15 4.2V9m0 0h4.8M15 9l6-6" }], ["path", { "d": "M9 4.2V9m0 0H4.2M9 9 3 3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ShrinkIcon
});
