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
var building_circus_exports = {};
__export(building_circus_exports, {
  BuildingCircusIcon: () => BuildingCircusIcon
});
module.exports = __toCommonJS(building_circus_exports);
var import_create_icon = require("../../create-icon.cjs");
const BuildingCircusIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BuildingCircusIcon", [["path", { "d": "M4 11h16" }], ["path", { "d": "M12 6.5c0 1 -5 4.5 -8 4.5" }], ["path", { "d": "M12 6.5c0 1 5 4.5 8 4.5" }], ["path", { "d": "M6 11c-.333 5.333 -1 8.667 -2 10h4c1 0 4 -4 4 -9v-1" }], ["path", { "d": "M18 11c.333 5.333 1 8.667 2 10h-4c-1 0 -4 -4 -4 -9v-1" }], ["path", { "d": "M12 7v-4l2 1h-2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BuildingCircusIcon
});
