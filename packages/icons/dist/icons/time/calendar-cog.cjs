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
var calendar_cog_exports = {};
__export(calendar_cog_exports, {
  CalendarCogIcon: () => CalendarCogIcon
});
module.exports = __toCommonJS(calendar_cog_exports);
var import_create_icon = require("../../create-icon.cjs");
const CalendarCogIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CalendarCogIcon", [["path", { "d": "m15.228 16.852-.923-.383" }], ["path", { "d": "m15.228 19.148-.923.383" }], ["path", { "d": "M16 2v3" }], ["path", { "d": "m16.47 14.305.382.923" }], ["path", { "d": "m16.852 20.772-.383.924" }], ["path", { "d": "m19.148 15.228.383-.923" }], ["path", { "d": "m19.53 21.696-.382-.924" }], ["path", { "d": "m20.773 16.852.924-.383" }], ["path", { "d": "m20.773 19.148.924.383" }], ["path", { "d": "M21 10.5V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h5.5" }], ["path", { "d": "M3 9h18" }], ["path", { "d": "M8 2v3" }], ["circle", { "cx": "18", "cy": "18", "r": "3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CalendarCogIcon
});
