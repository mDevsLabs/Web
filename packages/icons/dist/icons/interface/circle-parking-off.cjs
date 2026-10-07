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
var circle_parking_off_exports = {};
__export(circle_parking_off_exports, {
  CircleParkingOffIcon: () => CircleParkingOffIcon
});
module.exports = __toCommonJS(circle_parking_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const CircleParkingOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CircleParkingOffIcon", [["path", { "d": "M12.656 7H13a3 3 0 0 1 2.984 3.307" }], ["path", { "d": "M13 13H9" }], ["path", { "d": "M19.071 19.071A1 1 0 0 1 4.93 4.93" }], ["path", { "d": "m2 2 20 20" }], ["path", { "d": "M8.357 2.687a10 10 0 0 1 12.956 12.956" }], ["path", { "d": "M9 17V9" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CircleParkingOffIcon
});
