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
var map_plus_exports = {};
__export(map_plus_exports, {
  MapPlusIcon: () => MapPlusIcon
});
module.exports = __toCommonJS(map_plus_exports);
var import_create_icon = require("../../create-icon.cjs");
const MapPlusIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MapPlusIcon", [["path", { "d": "m11 19-1.106-.552a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0l4.212 2.106a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619V12" }], ["path", { "d": "M15 5.764V12" }], ["path", { "d": "M18 15v6" }], ["path", { "d": "M21 18h-6" }], ["path", { "d": "M9 3.236v15" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MapPlusIcon
});
