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
var door_closed_cog_exports = {};
__export(door_closed_cog_exports, {
  DoorClosedCogIcon: () => DoorClosedCogIcon
});
module.exports = __toCommonJS(door_closed_cog_exports);
var import_create_icon = require("../../create-icon.cjs");
const DoorClosedCogIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("DoorClosedCogIcon", [["path", { "d": "m14.305 19.53.923-.382" }], ["path", { "d": "m15.229 16.852-.924-.383" }], ["path", { "d": "m16.852 15.228-.383-.923" }], ["path", { "d": "m16.852 20.773-.383.924" }], ["path", { "d": "M19 10.35V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" }], ["path", { "d": "m19.148 15.228.383-.923" }], ["path", { "d": "m19.53 21.697-.382-.924" }], ["path", { "d": "M2 21h8.58" }], ["path", { "d": "m20.773 16.852.922-.383" }], ["path", { "d": "m20.773 19.148.922.383" }], ["path", { "d": "M9 12h.01" }], ["circle", { "cx": "18", "cy": "18", "r": "3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DoorClosedCogIcon
});
