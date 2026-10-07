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
var wine_exports = {};
__export(wine_exports, {
  WineIcon: () => WineIcon
});
module.exports = __toCommonJS(wine_exports);
var import_create_icon = require("../../create-icon.cjs");
const WineIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("WineIcon", [["path", { "d": "M8 22h8" }], ["path", { "d": "M7 10h10" }], ["path", { "d": "M12 15v7" }], ["path", { "d": "M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  WineIcon
});
