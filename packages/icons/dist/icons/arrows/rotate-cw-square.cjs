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
var rotate_cw_square_exports = {};
__export(rotate_cw_square_exports, {
  RotateCwSquareIcon: () => RotateCwSquareIcon
});
module.exports = __toCommonJS(rotate_cw_square_exports);
var import_create_icon = require("../../create-icon.cjs");
const RotateCwSquareIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("RotateCwSquareIcon", [["path", { "d": "M12 5H6a2 2 0 0 0-2 2v3" }], ["path", { "d": "m9 8 3-3-3-3" }], ["path", { "d": "M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RotateCwSquareIcon
});
