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
var camera_off_exports = {};
__export(camera_off_exports, {
  CameraOffIcon: () => CameraOffIcon
});
module.exports = __toCommonJS(camera_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const CameraOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CameraOffIcon", [["path", { "d": "M14.564 14.558a3 3 0 1 1-4.122-4.121" }], ["path", { "d": "m2 2 20 20" }], ["path", { "d": "M20 20H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 .819-.175" }], ["path", { "d": "M9.695 4.024A2 2 0 0 1 10.004 4h3.993a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v7.344" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CameraOffIcon
});
