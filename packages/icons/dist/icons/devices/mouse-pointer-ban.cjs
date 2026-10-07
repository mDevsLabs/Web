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
var mouse_pointer_ban_exports = {};
__export(mouse_pointer_ban_exports, {
  MousePointerBanIcon: () => MousePointerBanIcon
});
module.exports = __toCommonJS(mouse_pointer_ban_exports);
var import_create_icon = require("../../create-icon.cjs");
const MousePointerBanIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MousePointerBanIcon", [["path", { "d": "M2.034 2.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.944L8.204 7.545a1 1 0 0 0-.66.66l-1.066 3.443a.5.5 0 0 1-.944.033z" }], ["circle", { "cx": "16", "cy": "16", "r": "6" }], ["path", { "d": "m11.8 11.8 8.4 8.4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MousePointerBanIcon
});
