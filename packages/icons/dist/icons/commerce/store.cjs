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
var store_exports = {};
__export(store_exports, {
  StoreIcon: () => StoreIcon
});
module.exports = __toCommonJS(store_exports);
var import_create_icon = require("../../create-icon.cjs");
const StoreIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("StoreIcon", [["path", { "d": "M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5" }], ["path", { "d": "M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244" }], ["path", { "d": "M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  StoreIcon
});
