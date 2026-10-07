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
var hand_finger_off_exports = {};
__export(hand_finger_off_exports, {
  HandFingerOffIcon: () => HandFingerOffIcon
});
module.exports = __toCommonJS(hand_finger_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const HandFingerOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("HandFingerOffIcon", [["path", { "d": "M8 13v-5" }], ["path", { "d": "M8.06 4.077a1.5 1.5 0 0 1 2.94 .423v2.5m0 4v1" }], ["path", { "d": "M12.063 8.065a1.5 1.5 0 0 1 1.937 1.435v.5" }], ["path", { "d": "M14.06 10.082a1.5 1.5 0 0 1 2.94 .418v1.5" }], ["path", { "d": "M17 11.5a1.5 1.5 0 0 1 3 0v4.5m-.88 3.129a6 6 0 0 1 -5.12 2.871h-2h.208a6 6 0 0 1 -5.012 -2.7l-.196 -.3c-.312 -.479 -1.407 -2.388 -3.286 -5.728a1.5 1.5 0 0 1 .536 -2.022a1.867 1.867 0 0 1 2.28 .28l1.47 1.47" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HandFingerOffIcon
});
