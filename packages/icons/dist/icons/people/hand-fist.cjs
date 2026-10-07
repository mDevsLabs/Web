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
var hand_fist_exports = {};
__export(hand_fist_exports, {
  HandFistIcon: () => HandFistIcon
});
module.exports = __toCommonJS(hand_fist_exports);
var import_create_icon = require("../../create-icon.cjs");
const HandFistIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("HandFistIcon", [["path", { "d": "M12.035 17.012a3 3 0 0 0-3-3l-.311-.002a.72.72 0 0 1-.505-1.229l1.195-1.195A2 2 0 0 1 10.828 11H12a2 2 0 0 0 0-4H9.243a3 3 0 0 0-2.122.879l-2.707 2.707A4.83 4.83 0 0 0 3 14a8 8 0 0 0 8 8h2a8 8 0 0 0 8-8V7a2 2 0 1 0-4 0v2a2 2 0 1 0 4 0" }], ["path", { "d": "M13.888 9.662A2 2 0 0 0 17 8V5A2 2 0 1 0 13 5" }], ["path", { "d": "M9 5A2 2 0 1 0 5 5V10" }], ["path", { "d": "M9 7V4A2 2 0 1 1 13 4V7.268" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HandFistIcon
});
