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
var list_filter_plus_exports = {};
__export(list_filter_plus_exports, {
  ListFilterPlusIcon: () => ListFilterPlusIcon
});
module.exports = __toCommonJS(list_filter_plus_exports);
var import_create_icon = require("../../create-icon.cjs");
const ListFilterPlusIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ListFilterPlusIcon", [["path", { "d": "M12 5H2" }], ["path", { "d": "M6 12h12" }], ["path", { "d": "M9 19h6" }], ["path", { "d": "M16 5h6" }], ["path", { "d": "M19 8V2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ListFilterPlusIcon
});
