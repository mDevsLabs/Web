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
var bike_exports = {};
__export(bike_exports, {
  BikeIcon: () => BikeIcon
});
module.exports = __toCommonJS(bike_exports);
var import_create_icon = require("../../create-icon.cjs");
const BikeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BikeIcon", [["circle", { "cx": "18.5", "cy": "17.5", "r": "3.5" }], ["circle", { "cx": "5.5", "cy": "17.5", "r": "3.5" }], ["circle", { "cx": "15", "cy": "5", "r": "1" }], ["path", { "d": "M12 17.5V14l-3-3 4-3 2 3h2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BikeIcon
});
