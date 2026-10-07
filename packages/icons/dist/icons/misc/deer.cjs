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
var deer_exports = {};
__export(deer_exports, {
  DeerIcon: () => DeerIcon
});
module.exports = __toCommonJS(deer_exports);
var import_create_icon = require("../../create-icon.cjs");
const DeerIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("DeerIcon", [["path", { "d": "M3 3c0 2 1 3 4 3c2 0 3 1 3 3" }], ["path", { "d": "M21 3c0 2 -1 3 -4 3c-2 0 -3 .333 -3 3" }], ["path", { "d": "M12 18c-1 0 -4 -3 -4 -6c0 -2 1.333 -3 4 -3s4 1 4 3c0 3 -3 6 -4 6" }], ["path", { "d": "M15.185 14.889l.095 -.18a4 4 0 1 1 -6.56 0" }], ["path", { "d": "M17 3c0 1.333 -.333 2.333 -1 3" }], ["path", { "d": "M7 3c0 1.333 .333 2.333 1 3" }], ["path", { "d": "M7 6c-2.667 .667 -4.333 1.667 -5 3" }], ["path", { "d": "M17 6c2.667 .667 4.333 1.667 5 3" }], ["path", { "d": "M8.5 10l-1.5 -1" }], ["path", { "d": "M15.5 10l1.5 -1" }], ["path", { "d": "M12 15h.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DeerIcon
});
