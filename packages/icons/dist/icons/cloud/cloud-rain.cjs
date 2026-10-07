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
var cloud_rain_exports = {};
__export(cloud_rain_exports, {
  CloudRainIcon: () => CloudRainIcon
});
module.exports = __toCommonJS(cloud_rain_exports);
var import_create_icon = require("../../create-icon.cjs");
const CloudRainIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CloudRainIcon", [["path", { "d": "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" }], ["path", { "d": "M16 14v6" }], ["path", { "d": "M8 14v6" }], ["path", { "d": "M12 16v6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CloudRainIcon
});
