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
var border_all_exports = {};
__export(border_all_exports, {
  BorderAllIcon: () => BorderAllIcon
});
module.exports = __toCommonJS(border_all_exports);
var import_create_icon = require("../../create-icon.cjs");
const BorderAllIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BorderAllIcon", [["path", { "d": "M4 6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -12" }], ["path", { "d": "M4 12l16 0" }], ["path", { "d": "M12 4l0 16" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BorderAllIcon
});
