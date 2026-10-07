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
var car_fan_3_exports = {};
__export(car_fan_3_exports, {
  CarFan3Icon: () => CarFan3Icon
});
module.exports = __toCommonJS(car_fan_3_exports);
var import_create_icon = require("../../create-icon.cjs");
const CarFan3Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CarFan3Icon", [["path", { "d": "M12 12v-9l4.912 1.914a1.7 1.7 0 0 1 .428 2.925l-5.34 4.161" }], ["path", { "d": "M14.044 14.624l-2.044 -2.624h4" }], ["path", { "d": "M12 12h-9l1.914 -4.912a1.7 1.7 0 0 1 2.925 -.428l4.161 5.34" }], ["path", { "d": "M12 12v9l-4.912 -1.914a1.7 1.7 0 0 1 -.428 -2.925l5.34 -4.161" }], ["path", { "d": "M18 15.5a.5 .5 0 0 1 .5 -.5h1a1.5 1.5 0 0 1 0 3h-.5h.5a1.5 1.5 0 0 1 0 3h-1a.5 .5 0 0 1 -.5 -.5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CarFan3Icon
});
