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
var split_exports = {};
__export(split_exports, {
  SplitIcon: () => SplitIcon
});
module.exports = __toCommonJS(split_exports);
var import_create_icon = require("../../create-icon.cjs");
const SplitIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SplitIcon", [["path", { "d": "M16 3h5v5" }], ["path", { "d": "M8 3H3v5" }], ["path", { "d": "M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" }], ["path", { "d": "m15 9 6-6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SplitIcon
});
