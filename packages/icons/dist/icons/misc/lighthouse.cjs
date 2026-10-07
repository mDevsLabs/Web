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
var lighthouse_exports = {};
__export(lighthouse_exports, {
  LighthouseIcon: () => LighthouseIcon
});
module.exports = __toCommonJS(lighthouse_exports);
var import_create_icon = require("../../create-icon.cjs");
const LighthouseIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("LighthouseIcon", [["path", { "d": "M12 3V2" }], ["path", { "d": "M16.066 16.865 7 22l2-11V6a3 3 0 016 0v5l2 11" }], ["path", { "d": "m19.792 4.5.866-.5" }], ["path", { "d": "m19.797 13.5.866.5" }], ["path", { "d": "M21 9h1" }], ["path", { "d": "M3 9H2" }], ["path", { "d": "m4.203 13.5-.866.5" }], ["path", { "d": "M4.208 4.5 3.342 4" }], ["path", { "d": "M5.5 22h13" }], ["path", { "d": "m7.932 16.875 7.377-4.178" }], ["path", { "d": "M8 11h8" }], ["path", { "d": "M8 7h8" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LighthouseIcon
});
