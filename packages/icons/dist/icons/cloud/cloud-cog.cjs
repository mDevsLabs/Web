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
var cloud_cog_exports = {};
__export(cloud_cog_exports, {
  CloudCogIcon: () => CloudCogIcon
});
module.exports = __toCommonJS(cloud_cog_exports);
var import_create_icon = require("../../create-icon.cjs");
const CloudCogIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CloudCogIcon", [["path", { "d": "m10.852 19.772-.383.924" }], ["path", { "d": "m13.148 14.228.383-.923" }], ["path", { "d": "M13.148 19.772a3 3 0 1 0-2.296-5.544l-.383-.923" }], ["path", { "d": "m13.53 20.696-.382-.924a3 3 0 1 1-2.296-5.544" }], ["path", { "d": "m14.772 15.852.923-.383" }], ["path", { "d": "m14.772 18.148.923.383" }], ["path", { "d": "M4.2 15.1a7 7 0 1 1 9.93-9.858A7 7 0 0 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.2" }], ["path", { "d": "m9.228 15.852-.923-.383" }], ["path", { "d": "m9.228 18.148-.923.383" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CloudCogIcon
});
