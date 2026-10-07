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
var rotate_ccw_key_exports = {};
__export(rotate_ccw_key_exports, {
  RotateCcwKeyIcon: () => RotateCcwKeyIcon
});
module.exports = __toCommonJS(rotate_ccw_key_exports);
var import_create_icon = require("../../create-icon.cjs");
const RotateCcwKeyIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("RotateCcwKeyIcon", [["path", { "d": "M12 7v6" }], ["path", { "d": "M12 9h2" }], ["path", { "d": "M3 12a9 9 0 1 0 9-9 9.74 9.74 0 0 0-6.74 2.74L3 8" }], ["path", { "d": "M3 3v5h5" }], ["circle", { "cx": "12", "cy": "15", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RotateCcwKeyIcon
});
