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
var access_point_off_exports = {};
__export(access_point_off_exports, {
  AccessPointOffIcon: () => AccessPointOffIcon
});
module.exports = __toCommonJS(access_point_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const AccessPointOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AccessPointOffIcon", [["path", { "d": "M3 3l18 18" }], ["path", { "d": "M14.828 9.172a4 4 0 0 1 1.172 2.828" }], ["path", { "d": "M17.657 6.343a8 8 0 0 1 1.635 8.952" }], ["path", { "d": "M9.168 14.828a4 4 0 0 1 0 -5.656" }], ["path", { "d": "M6.337 17.657a8 8 0 0 1 0 -11.314" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AccessPointOffIcon
});
