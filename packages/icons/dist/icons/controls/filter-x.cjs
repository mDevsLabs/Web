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
var filter_x_exports = {};
__export(filter_x_exports, {
  FilterXIcon: () => FilterXIcon
});
module.exports = __toCommonJS(filter_x_exports);
var import_create_icon = require("../../create-icon.cjs");
const FilterXIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FilterXIcon", [["path", { "d": "M12.531 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14v6a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341l.427-.473" }], ["path", { "d": "m16.5 3.5 5 5" }], ["path", { "d": "m21.5 3.5-5 5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FilterXIcon
});
