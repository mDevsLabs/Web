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
var forklift_exports = {};
__export(forklift_exports, {
  ForkliftIcon: () => ForkliftIcon
});
module.exports = __toCommonJS(forklift_exports);
var import_create_icon = require("../../create-icon.cjs");
const ForkliftIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ForkliftIcon", [["path", { "d": "M12 12H5a2 2 0 0 0-2 2v5" }], ["path", { "d": "M15 19h7" }], ["path", { "d": "M16 19V2" }], ["path", { "d": "M6 12V7a2 2 0 0 1 2-2h2.172a2 2 0 0 1 1.414.586l3.828 3.828A2 2 0 0 1 16 10.828" }], ["path", { "d": "M7 19h4" }], ["circle", { "cx": "13", "cy": "19", "r": "2" }], ["circle", { "cx": "5", "cy": "19", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ForkliftIcon
});
