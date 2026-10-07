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
var list_restart_exports = {};
__export(list_restart_exports, {
  ListRestartIcon: () => ListRestartIcon
});
module.exports = __toCommonJS(list_restart_exports);
var import_create_icon = require("../../create-icon.cjs");
const ListRestartIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ListRestartIcon", [["path", { "d": "M21 5H3" }], ["path", { "d": "M7 12H3" }], ["path", { "d": "M7 19H3" }], ["path", { "d": "M12 18a5 5 0 0 0 9-3 4.5 4.5 0 0 0-4.5-4.5c-1.33 0-2.54.54-3.41 1.41L11 14" }], ["path", { "d": "M11 10v4h4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ListRestartIcon
});
