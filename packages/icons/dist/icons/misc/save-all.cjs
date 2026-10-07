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
var save_all_exports = {};
__export(save_all_exports, {
  SaveAllIcon: () => SaveAllIcon
});
module.exports = __toCommonJS(save_all_exports);
var import_create_icon = require("../../create-icon.cjs");
const SaveAllIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SaveAllIcon", [["path", { "d": "M10 2v3a1 1 0 0 0 1 1h5" }], ["path", { "d": "M18 18v-6a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6" }], ["path", { "d": "M18 22H4a2 2 0 0 1-2-2V6" }], ["path", { "d": "M8 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9.172a2 2 0 0 1 1.414.586l2.828 2.828A2 2 0 0 1 22 6.828V16a2 2 0 0 1-2.01 2z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SaveAllIcon
});
