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
var box_exports = {};
__export(box_exports, {
  BoxIcon: () => BoxIcon
});
module.exports = __toCommonJS(box_exports);
var import_create_icon = require("../../create-icon.cjs");
const BoxIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BoxIcon", [["path", { "d": "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" }], ["path", { "d": "m3.3 7 8.7 5 8.7-5" }], ["path", { "d": "M12 22V12" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BoxIcon
});
