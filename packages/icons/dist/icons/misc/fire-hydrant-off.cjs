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
var fire_hydrant_off_exports = {};
__export(fire_hydrant_off_exports, {
  FireHydrantOffIcon: () => FireHydrantOffIcon
});
module.exports = __toCommonJS(fire_hydrant_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const FireHydrantOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FireHydrantOffIcon", [["path", { "d": "M5 21h14" }], ["path", { "d": "M17 21v-4m2 -2v-2a1 1 0 0 0 -1 -1h-1v-4a5 5 0 0 0 -8.533 -3.538m-1.387 2.638a5.03 5.03 0 0 0 -.08 .9v4h-1a1 1 0 0 0 -1 1v2a1 1 0 0 0 1 1h1v5" }], ["path", { "d": "M12 12a2 2 0 1 0 2 2" }], ["path", { "d": "M6 8h2m4 0h6" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FireHydrantOffIcon
});
