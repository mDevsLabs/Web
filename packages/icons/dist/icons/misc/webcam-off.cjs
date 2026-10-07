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
var webcam_off_exports = {};
__export(webcam_off_exports, {
  WebcamOffIcon: () => WebcamOffIcon
});
module.exports = __toCommonJS(webcam_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const WebcamOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("WebcamOffIcon", [["path", { "d": "M12 22v-4" }], ["path", { "d": "M12.754 7.096a3 3 0 0 1 2.15 2.15" }], ["path", { "d": "M12.863 12.873a3 3 0 0 1-3.736-3.735" }], ["path", { "d": "M16.566 16.57A8 8 0 0 1 5.43 5.433" }], ["path", { "d": "m2 2 20 20" }], ["path", { "d": "M7 22h10" }], ["path", { "d": "M8.478 2.817a8 8 0 0 1 10.705 10.705" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  WebcamOffIcon
});
