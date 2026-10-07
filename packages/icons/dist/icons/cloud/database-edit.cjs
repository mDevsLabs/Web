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
var database_edit_exports = {};
__export(database_edit_exports, {
  DatabaseEditIcon: () => DatabaseEditIcon
});
module.exports = __toCommonJS(database_edit_exports);
var import_create_icon = require("../../create-icon.cjs");
const DatabaseEditIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("DatabaseEditIcon", [["path", { "d": "M4 6c0 1.657 3.582 3 8 3s8 -1.343 8 -3s-3.582 -3 -8 -3s-8 1.343 -8 3" }], ["path", { "d": "M4 6v6c0 1.657 3.582 3 8 3c.478 0 .947 -.016 1.402 -.046" }], ["path", { "d": "M20 12v-6" }], ["path", { "d": "M4 12v6c0 1.526 3.04 2.786 6.972 2.975" }], ["path", { "d": "M18.42 15.61a2.1 2.1 0 0 1 2.97 2.97l-3.39 3.42h-3v-3l3.42 -3.39" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DatabaseEditIcon
});
