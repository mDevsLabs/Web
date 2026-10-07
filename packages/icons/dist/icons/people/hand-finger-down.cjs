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
var hand_finger_down_exports = {};
__export(hand_finger_down_exports, {
  HandFingerDownIcon: () => HandFingerDownIcon
});
module.exports = __toCommonJS(hand_finger_down_exports);
var import_create_icon = require("../../create-icon.cjs");
const HandFingerDownIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("HandFingerDownIcon", [["path", { "d": "M8 12v8.5a1.5 1.5 0 0 0 3 0v-7.5" }], ["path", { "d": "M11 13.5v2a1.5 1.5 0 0 0 3 0v-2.5" }], ["path", { "d": "M14 14.5a1.5 1.5 0 0 0 3 0v-1.5" }], ["path", { "d": "M17 13.5a1.5 1.5 0 0 0 3 0v-4.5a6 6 0 0 0 -6 -6h-2h.208a6 6 0 0 0 -5.012 2.7l-.196 .3q -.468 .718 -3.286 5.728a1.5 1.5 0 0 0 .536 2.022c.734 .44 1.674 .325 2.28 -.28l1.47 -1.47" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HandFingerDownIcon
});
