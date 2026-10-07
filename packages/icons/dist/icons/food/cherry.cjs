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
var cherry_exports = {};
__export(cherry_exports, {
  CherryIcon: () => CherryIcon
});
module.exports = __toCommonJS(cherry_exports);
var import_create_icon = require("../../create-icon.cjs");
const CherryIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CherryIcon", [["path", { "d": "M2 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-3-2.5-2-5 .24-5 3Z" }], ["path", { "d": "M12 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-3-2.5-2-5 .24-5 3Z" }], ["path", { "d": "M7 14c3.22-2.91 4.29-8.75 5-12 1.66 2.38 4.94 9 5 12" }], ["path", { "d": "M22 9c-4.29 0-7.14-2.33-10-7 5.71 0 10 4.67 10 7Z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CherryIcon
});
