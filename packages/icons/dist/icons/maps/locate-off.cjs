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
var locate_off_exports = {};
__export(locate_off_exports, {
  LocateOffIcon: () => LocateOffIcon
});
module.exports = __toCommonJS(locate_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const LocateOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("LocateOffIcon", [["path", { "d": "M12 19v3" }], ["path", { "d": "M12 2v3" }], ["path", { "d": "M18.89 13.24a7 7 0 0 0-8.13-8.13" }], ["path", { "d": "M19 12h3" }], ["path", { "d": "M2 12h3" }], ["path", { "d": "m2 2 20 20" }], ["path", { "d": "M7.05 7.05a7 7 0 0 0 9.9 9.9" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LocateOffIcon
});
