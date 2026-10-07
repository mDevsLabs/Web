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
var scissors_square_dashed_bottom_exports = {};
__export(scissors_square_dashed_bottom_exports, {
  ScissorsSquareDashedBottomIcon: () => ScissorsSquareDashedBottomIcon
});
module.exports = __toCommonJS(scissors_square_dashed_bottom_exports);
var import_create_icon = require("../../create-icon.cjs");
const ScissorsSquareDashedBottomIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ScissorsSquareDashedBottomIcon", [["path", { "d": "M14 21h1" }], ["path", { "d": "m17 17-2.18-2.18" }], ["path", { "d": "M5 21a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2" }], ["path", { "d": "M9 21h1" }], ["path", { "d": "M9.56 14.44 17 7" }], ["path", { "d": "M9.56 9.56 12 12" }], ["circle", { "cx": "8.5", "cy": "15.5", "r": "1.5" }], ["circle", { "cx": "8.5", "cy": "8.5", "r": "1.5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ScissorsSquareDashedBottomIcon
});
