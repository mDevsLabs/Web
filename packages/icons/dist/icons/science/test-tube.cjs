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
var test_tube_exports = {};
__export(test_tube_exports, {
  TestTubeIcon: () => TestTubeIcon
});
module.exports = __toCommonJS(test_tube_exports);
var import_create_icon = require("../../create-icon.cjs");
const TestTubeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TestTubeIcon", [["path", { "d": "M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5c-1.4 0-2.5-1.1-2.5-2.5V2" }], ["path", { "d": "M8.5 2h7" }], ["path", { "d": "M14.5 16h-5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TestTubeIcon
});
