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
var fold_vertical_exports = {};
__export(fold_vertical_exports, {
  FoldVerticalIcon: () => FoldVerticalIcon
});
module.exports = __toCommonJS(fold_vertical_exports);
var import_create_icon = require("../../create-icon.cjs");
const FoldVerticalIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FoldVerticalIcon", [["path", { "d": "M12 22v-6" }], ["path", { "d": "M12 8V2" }], ["path", { "d": "M4 12H2" }], ["path", { "d": "M10 12H8" }], ["path", { "d": "M16 12h-2" }], ["path", { "d": "M22 12h-2" }], ["path", { "d": "m15 19-3-3-3 3" }], ["path", { "d": "m15 5-3 3-3-3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FoldVerticalIcon
});
