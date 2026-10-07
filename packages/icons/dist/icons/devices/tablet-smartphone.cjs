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
var tablet_smartphone_exports = {};
__export(tablet_smartphone_exports, {
  TabletSmartphoneIcon: () => TabletSmartphoneIcon
});
module.exports = __toCommonJS(tablet_smartphone_exports);
var import_create_icon = require("../../create-icon.cjs");
const TabletSmartphoneIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TabletSmartphoneIcon", [["rect", { "width": "10", "height": "14", "x": "3", "y": "8", "rx": "2" }], ["path", { "d": "M5 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-2.4" }], ["path", { "d": "M8 18h.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TabletSmartphoneIcon
});
