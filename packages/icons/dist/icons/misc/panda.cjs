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
var panda_exports = {};
__export(panda_exports, {
  PandaIcon: () => PandaIcon
});
module.exports = __toCommonJS(panda_exports);
var import_create_icon = require("../../create-icon.cjs");
const PandaIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PandaIcon", [["path", { "d": "M11.25 17.25h1.5L12 18z" }], ["path", { "d": "m15 12 2 2" }], ["path", { "d": "M17.902 6.599a8 8 0 0 0-.5-.5" }], ["path", { "d": "M2 14.5C2 19.47 6.48 22 12 22s10-2.53 10-7.5a10 10 0 0 0-1.3-4.83 4.5 4.5 0 1 0-7.05-5.5 8 8 0 0 0-3.3 0 4.5 4.5 0 1 0-7.04 5.5A10 10 0 0 0 2 14.5" }], ["path", { "d": "M6.099 6.599a8 8 0 0 1 .5-.5" }], ["path", { "d": "m9 12-2 2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PandaIcon
});
