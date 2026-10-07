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
var monitor_cog_exports = {};
__export(monitor_cog_exports, {
  MonitorCogIcon: () => MonitorCogIcon
});
module.exports = __toCommonJS(monitor_cog_exports);
var import_create_icon = require("../../create-icon.cjs");
const MonitorCogIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MonitorCogIcon", [["path", { "d": "M12 17v4" }], ["path", { "d": "m14.305 7.53.923-.382" }], ["path", { "d": "m15.228 4.852-.923-.383" }], ["path", { "d": "m16.852 3.228-.383-.924" }], ["path", { "d": "m16.852 8.772-.383.923" }], ["path", { "d": "m19.148 3.228.383-.924" }], ["path", { "d": "m19.53 9.696-.382-.924" }], ["path", { "d": "m20.772 4.852.924-.383" }], ["path", { "d": "m20.772 7.148.924.383" }], ["path", { "d": "M22 13v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" }], ["path", { "d": "M8 21h8" }], ["circle", { "cx": "18", "cy": "6", "r": "3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MonitorCogIcon
});
