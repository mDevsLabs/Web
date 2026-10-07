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
var circle_asterisk_exports = {};
__export(circle_asterisk_exports, {
  CircleAsteriskIcon: () => CircleAsteriskIcon
});
module.exports = __toCommonJS(circle_asterisk_exports);
var import_create_icon = require("../../create-icon.cjs");
const CircleAsteriskIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CircleAsteriskIcon", [["path", { "d": "M12 8.5v7" }], ["path", { "d": "M9 10l6 4" }], ["path", { "d": "M9 14l6 -4" }], ["path", { "d": "M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CircleAsteriskIcon
});
