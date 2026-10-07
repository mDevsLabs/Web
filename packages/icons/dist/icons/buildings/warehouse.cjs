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
var warehouse_exports = {};
__export(warehouse_exports, {
  WarehouseIcon: () => WarehouseIcon
});
module.exports = __toCommonJS(warehouse_exports);
var import_create_icon = require("../../create-icon.cjs");
const WarehouseIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("WarehouseIcon", [["path", { "d": "M18 21V10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v11" }], ["path", { "d": "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 1.132-1.803l7.95-3.974a2 2 0 0 1 1.837 0l7.948 3.974A2 2 0 0 1 22 8z" }], ["path", { "d": "M6 13h12" }], ["path", { "d": "M6 17h12" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  WarehouseIcon
});
