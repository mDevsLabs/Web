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
var cloud_storm_exports = {};
__export(cloud_storm_exports, {
  CloudStormIcon: () => CloudStormIcon
});
module.exports = __toCommonJS(cloud_storm_exports);
var import_create_icon = require("../../create-icon.cjs");
const CloudStormIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CloudStormIcon", [["path", { "d": "M7 18a4.6 4.4 0 0 1 0 -9a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7h-1" }], ["path", { "d": "M13 14l-2 4l3 0l-2 4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CloudStormIcon
});
