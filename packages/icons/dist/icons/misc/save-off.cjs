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
var save_off_exports = {};
__export(save_off_exports, {
  SaveOffIcon: () => SaveOffIcon
});
module.exports = __toCommonJS(save_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const SaveOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SaveOffIcon", [["path", { "d": "M13 13H8a1 1 0 0 0-1 1v7" }], ["path", { "d": "M14 8h1" }], ["path", { "d": "M17 21v-4" }], ["path", { "d": "m2 2 20 20" }], ["path", { "d": "M20.41 20.41A2 2 0 0 1 19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 .59-1.41" }], ["path", { "d": "M9 3h6.2a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V15" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SaveOffIcon
});
