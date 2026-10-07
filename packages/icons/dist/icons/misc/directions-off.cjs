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
var directions_off_exports = {};
__export(directions_off_exports, {
  DirectionsOffIcon: () => DirectionsOffIcon
});
module.exports = __toCommonJS(directions_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const DirectionsOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("DirectionsOffIcon", [["path", { "d": "M12 21v-4" }], ["path", { "d": "M12 13v-1" }], ["path", { "d": "M12 5v-2" }], ["path", { "d": "M10 21h4" }], ["path", { "d": "M8 8v1h1m4 0h6l2 -2l-2 -2h-10" }], ["path", { "d": "M14 14v3h-8l-2 -2l2 -2h7" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DirectionsOffIcon
});
