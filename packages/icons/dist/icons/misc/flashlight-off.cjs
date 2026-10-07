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
var flashlight_off_exports = {};
__export(flashlight_off_exports, {
  FlashlightOffIcon: () => FlashlightOffIcon
});
module.exports = __toCommonJS(flashlight_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const FlashlightOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FlashlightOffIcon", [["path", { "d": "M11.652 6H18" }], ["path", { "d": "M12 13v1" }], ["path", { "d": "M16 16v4a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-8a4 4 0 0 0-.8-2.4l-.6-.8A3 3 0 0 1 6 7V6" }], ["path", { "d": "m2 2 20 20" }], ["path", { "d": "M7.649 2H17a1 1 0 0 1 1 1v4a3 3 0 0 1-.6 1.8l-.6.8a4 4 0 0 0-.55 1.007" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FlashlightOffIcon
});
