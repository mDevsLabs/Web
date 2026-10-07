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
var split_square_horizontal_exports = {};
__export(split_square_horizontal_exports, {
  SplitSquareHorizontalIcon: () => SplitSquareHorizontalIcon
});
module.exports = __toCommonJS(split_square_horizontal_exports);
var import_create_icon = require("../../create-icon.cjs");
const SplitSquareHorizontalIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SplitSquareHorizontalIcon", [["path", { "d": "M12 2v20" }], ["path", { "d": "M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" }], ["path", { "d": "M8 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SplitSquareHorizontalIcon
});
