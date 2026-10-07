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
var balloon_exports = {};
__export(balloon_exports, {
  BalloonIcon: () => BalloonIcon
});
module.exports = __toCommonJS(balloon_exports);
var import_create_icon = require("../../create-icon.cjs");
const BalloonIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BalloonIcon", [["path", { "d": "M12 16v1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v1" }], ["path", { "d": "M12 6a2 2 0 0 1 2 2" }], ["path", { "d": "M18 8c0 4-3.5 8-6 8s-6-4-6-8a6 6 0 0 1 12 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BalloonIcon
});
