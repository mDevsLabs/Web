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
var clapperboard_exports = {};
__export(clapperboard_exports, {
  ClapperboardIcon: () => ClapperboardIcon
});
module.exports = __toCommonJS(clapperboard_exports);
var import_create_icon = require("../../create-icon.cjs");
const ClapperboardIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ClapperboardIcon", [["path", { "d": "m12.296 3.464 3.02 3.956" }], ["path", { "d": "M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3z" }], ["path", { "d": "M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }], ["path", { "d": "m6.18 5.276 3.1 3.899" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ClapperboardIcon
});
