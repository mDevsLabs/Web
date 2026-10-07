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
var alien_exports = {};
__export(alien_exports, {
  AlienIcon: () => AlienIcon
});
module.exports = __toCommonJS(alien_exports);
var import_create_icon = require("../../create-icon.cjs");
const AlienIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AlienIcon", [["path", { "d": "M11 17a2.5 2.5 0 0 0 2 0" }], ["path", { "d": "M12 3c-4.664 0 -7.396 2.331 -7.862 5.595a11.816 11.816 0 0 0 2 8.592a10.777 10.777 0 0 0 3.199 3.064c1.666 1 3.664 1 5.33 0a10.777 10.777 0 0 0 3.199 -3.064a11.89 11.89 0 0 0 2 -8.592c-.466 -3.265 -3.198 -5.595 -7.862 -5.595l-.004 0" }], ["path", { "d": "M8 11l2 2" }], ["path", { "d": "M16 11l-2 2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AlienIcon
});
