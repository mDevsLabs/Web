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
var server_cog_exports = {};
__export(server_cog_exports, {
  ServerCogIcon: () => ServerCogIcon
});
module.exports = __toCommonJS(server_cog_exports);
var import_create_icon = require("../../create-icon.cjs");
const ServerCogIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ServerCogIcon", [["path", { "d": "m10.852 14.772-.383.923" }], ["path", { "d": "M13.148 14.772a3 3 0 1 0-2.296-5.544l-.383-.923" }], ["path", { "d": "m13.148 9.228.383-.923" }], ["path", { "d": "m13.53 15.696-.382-.924a3 3 0 1 1-2.296-5.544" }], ["path", { "d": "m14.772 10.852.923-.383" }], ["path", { "d": "m14.772 13.148.923.383" }], ["path", { "d": "M4.5 10H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-.5" }], ["path", { "d": "M4.5 14H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-.5" }], ["path", { "d": "M6 18h.01" }], ["path", { "d": "M6 6h.01" }], ["path", { "d": "m9.228 10.852-.923-.383" }], ["path", { "d": "m9.228 13.148-.923.383" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ServerCogIcon
});
