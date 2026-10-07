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
var boxes_exports = {};
__export(boxes_exports, {
  BoxesIcon: () => BoxesIcon
});
module.exports = __toCommonJS(boxes_exports);
var import_create_icon = require("../../create-icon.cjs");
const BoxesIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BoxesIcon", [["path", { "d": "M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z" }], ["path", { "d": "m7 16.5-4.74-2.85" }], ["path", { "d": "m7 16.5 5-3" }], ["path", { "d": "M7 16.5v5.17" }], ["path", { "d": "M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z" }], ["path", { "d": "m17 16.5-5-3" }], ["path", { "d": "m17 16.5 4.74-2.85" }], ["path", { "d": "M17 16.5v5.17" }], ["path", { "d": "M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z" }], ["path", { "d": "M12 8 7.26 5.15" }], ["path", { "d": "m12 8 4.74-2.85" }], ["path", { "d": "M12 13.5V8" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BoxesIcon
});
