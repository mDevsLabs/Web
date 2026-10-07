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
var road_exports = {};
__export(road_exports, {
  RoadIcon: () => RoadIcon
});
module.exports = __toCommonJS(road_exports);
var import_create_icon = require("../../create-icon.cjs");
const RoadIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("RoadIcon", [["path", { "d": "M12 17v4" }], ["path", { "d": "M12 5V3" }], ["path", { "d": "M12 9v3" }], ["path", { "d": "M2.077 18.449A2 2 0 0 0 4 21h16a2 2 0 0 0 1.924-2.55l-4-14A2 2 0 0 0 16 3H8a2 2 0 0 0-1.924 1.45z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RoadIcon
});
