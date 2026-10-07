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
var touchpad_off_exports = {};
__export(touchpad_off_exports, {
  TouchpadOffIcon: () => TouchpadOffIcon
});
module.exports = __toCommonJS(touchpad_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const TouchpadOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TouchpadOffIcon", [["path", { "d": "M12 20v-6" }], ["path", { "d": "M19.656 14H22" }], ["path", { "d": "M2 14h12" }], ["path", { "d": "m2 2 20 20" }], ["path", { "d": "M20 20H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2" }], ["path", { "d": "M9.656 4H20a2 2 0 0 1 2 2v10.344" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TouchpadOffIcon
});
