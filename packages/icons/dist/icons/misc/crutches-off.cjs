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
var crutches_off_exports = {};
__export(crutches_off_exports, {
  CrutchesOffIcon: () => CrutchesOffIcon
});
module.exports = __toCommonJS(crutches_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const CrutchesOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CrutchesOffIcon", [["path", { "d": "M8.178 4.174a2 2 0 0 1 1.822 -1.174h4a2 2 0 1 1 0 4h-3" }], ["path", { "d": "M11 21h2" }], ["path", { "d": "M12 21v-4.092a3 3 0 0 1 .504 -1.664l.992 -1.488a3 3 0 0 0 .097 -.155m.407 -3.601v-3" }], ["path", { "d": "M12 21v-4.092a3 3 0 0 0 -.504 -1.664l-.992 -1.488a3 3 0 0 1 -.504 -1.664v-2.092" }], ["path", { "d": "M10 11h1" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CrutchesOffIcon
});
