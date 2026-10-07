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
var badge_3k_exports = {};
__export(badge_3k_exports, {
  Badge3kIcon: () => Badge3kIcon
});
module.exports = __toCommonJS(badge_3k_exports);
var import_create_icon = require("../../create-icon.cjs");
const Badge3kIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Badge3kIcon", [["path", { "d": "M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2l0 -10" }], ["path", { "d": "M14 9v6" }], ["path", { "d": "M17 9l-2 3l2 3" }], ["path", { "d": "M15 12h-1" }], ["path", { "d": "M7 9.5a.5 .5 0 0 1 .5 -.5h1a1.5 1.5 0 0 1 0 3h-.5h.5a1.5 1.5 0 0 1 0 3h-1a.5 .5 0 0 1 -.5 -.5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Badge3kIcon
});
