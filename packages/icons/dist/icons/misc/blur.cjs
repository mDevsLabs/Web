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
var blur_exports = {};
__export(blur_exports, {
  BlurIcon: () => BlurIcon
});
module.exports = __toCommonJS(blur_exports);
var import_create_icon = require("../../create-icon.cjs");
const BlurIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BlurIcon", [["path", { "d": "M12 21a9.01 9.01 0 0 0 2.32 -.302a9 9 0 0 0 1.74 -16.733a9 9 0 1 0 -4.06 17.035" }], ["path", { "d": "M12 3v17" }], ["path", { "d": "M12 12h9" }], ["path", { "d": "M12 9h8" }], ["path", { "d": "M12 6h6" }], ["path", { "d": "M12 18h6" }], ["path", { "d": "M12 15h8" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BlurIcon
});
