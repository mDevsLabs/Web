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
var campfire_exports = {};
__export(campfire_exports, {
  CampfireIcon: () => CampfireIcon
});
module.exports = __toCommonJS(campfire_exports);
var import_create_icon = require("../../create-icon.cjs");
const CampfireIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CampfireIcon", [["path", { "d": "M4 21l16 -4" }], ["path", { "d": "M20 21l-16 -4" }], ["path", { "d": "M12 15a4 4 0 0 0 4 -4c0 -3 -2 -3 -2 -8c-4 2 -6 5 -6 8a4 4 0 0 0 4 4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CampfireIcon
});
