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
var car_fan_exports = {};
__export(car_fan_exports, {
  CarFanIcon: () => CarFanIcon
});
module.exports = __toCommonJS(car_fan_exports);
var import_create_icon = require("../../create-icon.cjs");
const CarFanIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CarFanIcon", [["path", { "d": "M12 12v-9l4.912 1.914a1.7 1.7 0 0 1 .428 2.925l-5.34 4.161" }], ["path", { "d": "M12 12h9l-1.914 4.912a1.7 1.7 0 0 1 -2.925 .428l-4.161 -5.34" }], ["path", { "d": "M12 12h-9l1.914 -4.912a1.7 1.7 0 0 1 2.925 -.428l4.161 5.34" }], ["path", { "d": "M12 12v9l-4.912 -1.914a1.7 1.7 0 0 1 -.428 -2.925l5.34 -4.161" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CarFanIcon
});
