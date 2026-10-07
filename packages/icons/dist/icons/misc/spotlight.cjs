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
var spotlight_exports = {};
__export(spotlight_exports, {
  SpotlightIcon: () => SpotlightIcon
});
module.exports = __toCommonJS(spotlight_exports);
var import_create_icon = require("../../create-icon.cjs");
const SpotlightIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SpotlightIcon", [["path", { "d": "M15.295 19.562 16 22" }], ["path", { "d": "m17 16 3.758 2.098" }], ["path", { "d": "m19 12.5 3.026-.598" }], ["path", { "d": "M7.61 6.3a3 3 0 0 0-3.92 1.3l-1.38 2.79a3 3 0 0 0 1.3 3.91l6.89 3.597a1 1 0 0 0 1.342-.447l3.106-6.211a1 1 0 0 0-.447-1.341z" }], ["path", { "d": "M8 9V2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SpotlightIcon
});
