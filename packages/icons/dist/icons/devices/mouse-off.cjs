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
var mouse_off_exports = {};
__export(mouse_off_exports, {
  MouseOffIcon: () => MouseOffIcon
});
module.exports = __toCommonJS(mouse_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const MouseOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MouseOffIcon", [["path", { "d": "M12 6v.343" }], ["path", { "d": "M18.218 18.218A7 7 0 0 1 5 15V9a7 7 0 0 1 .782-3.218" }], ["path", { "d": "M19 13.343V9A7 7 0 0 0 8.56 2.902" }], ["path", { "d": "M22 22 2 2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MouseOffIcon
});
