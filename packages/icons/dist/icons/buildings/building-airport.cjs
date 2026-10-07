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
var building_airport_exports = {};
__export(building_airport_exports, {
  BuildingAirportIcon: () => BuildingAirportIcon
});
module.exports = __toCommonJS(building_airport_exports);
var import_create_icon = require("../../create-icon.cjs");
const BuildingAirportIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BuildingAirportIcon", [["path", { "d": "M3.59 7h8.82a1 1 0 0 1 .902 1.433l-1.44 3a1 1 0 0 1 -.901 .567h-5.942a1 1 0 0 1 -.901 -.567l-1.44 -3a1 1 0 0 1 .901 -1.433" }], ["path", { "d": "M6 7l-.78 -2.342a.5 .5 0 0 1 .473 -.658h4.612a.5 .5 0 0 1 .475 .658l-.78 2.342" }], ["path", { "d": "M8 2v2" }], ["path", { "d": "M6 12v9h4v-9" }], ["path", { "d": "M3 21h18" }], ["path", { "d": "M22 5h-6l-1 -1" }], ["path", { "d": "M18 3l2 2l-2 2" }], ["path", { "d": "M10 17h7a2 2 0 0 1 2 2v2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BuildingAirportIcon
});
