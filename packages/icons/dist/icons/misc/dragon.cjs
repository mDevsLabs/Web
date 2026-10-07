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
var dragon_exports = {};
__export(dragon_exports, {
  DragonIcon: () => DragonIcon
});
module.exports = __toCommonJS(dragon_exports);
var import_create_icon = require("../../create-icon.cjs");
const DragonIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("DragonIcon", [["path", { "d": "M10.706 8.849l-5.706 -3.301l-2 6.452l3.5 -1.973l.5 2.973l3.555 -1.385" }], ["path", { "d": "M15 9c0 3.5 4 3 4 7c0 3 -3 5 -5.5 5s-6 -.5 -6.5 -5c2 2 6.592 3.043 7.5 1c1.094 -2.461 -4 -3.459 -4 -6.5c0 -2.062 .5 -2.5 1.8 -3.2" }], ["path", { "d": "M18 6a3 3 270 1 0 -3 3h5l1 -3h-3" }], ["path", { "d": "M15 3h-8l5 3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DragonIcon
});
