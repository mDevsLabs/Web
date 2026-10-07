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
var dome_exports = {};
__export(dome_exports, {
  DomeIcon: () => DomeIcon
});
module.exports = __toCommonJS(dome_exports);
var import_create_icon = require("../../create-icon.cjs");
const DomeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("DomeIcon", [["path", { "d": "M10 21v-3a2 2 0 014 0v3" }], ["path", { "d": "M12 2v2" }], ["path", { "d": "M18 12v9" }], ["path", { "d": "M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2v-6a1 1 0 011-1h18a1 1 0 011 1z" }], ["path", { "d": "M4 12a8 8 0 0116 0" }], ["path", { "d": "M6 12v9" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DomeIcon
});
