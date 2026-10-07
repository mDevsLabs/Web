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
var square_sparkles_exports = {};
__export(square_sparkles_exports, {
  SquareSparklesIcon: () => SquareSparklesIcon
});
module.exports = __toCommonJS(square_sparkles_exports);
var import_create_icon = require("../../create-icon.cjs");
const SquareSparklesIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SquareSparklesIcon", [["path", { "d": "M11 15H7" }], ["path", { "d": "M15.41 2.49a.6.6 0 011.18 0l.63 3.334a1.2 1.2 0 00.956.955l3.334.631a.6.6 0 010 1.18l-3.334.63a1.2 1.2 0 00-.955.956l-.631 3.334a.6.6 0 01-1.18 0l-.63-3.334a1.2 1.2 0 00-.956-.955L10.49 8.59a.6.6 0 010-1.18l3.334-.63a1.2 1.2 0 00.955-.956z" }], ["path", { "d": "M21 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h6" }], ["path", { "d": "M9 13v4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SquareSparklesIcon
});
