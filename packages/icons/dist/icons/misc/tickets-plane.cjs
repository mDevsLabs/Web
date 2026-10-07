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
var tickets_plane_exports = {};
__export(tickets_plane_exports, {
  TicketsPlaneIcon: () => TicketsPlaneIcon
});
module.exports = __toCommonJS(tickets_plane_exports);
var import_create_icon = require("../../create-icon.cjs");
const TicketsPlaneIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TicketsPlaneIcon", [["path", { "d": "M10.5 17h1.227a2 2 0 0 0 1.345-.52L18 12" }], ["path", { "d": "m12 13.5 3.794.506" }], ["path", { "d": "m3.173 8.18 11-5a2 2 0 0 1 2.647.993L18.56 8" }], ["path", { "d": "M6 10V8" }], ["path", { "d": "M6 14v1" }], ["path", { "d": "M6 19v2" }], ["rect", { "x": "2", "y": "8", "width": "20", "height": "13", "rx": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TicketsPlaneIcon
});
