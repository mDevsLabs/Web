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
var martini_exports = {};
__export(martini_exports, {
  MartiniIcon: () => MartiniIcon
});
module.exports = __toCommonJS(martini_exports);
var import_create_icon = require("../../create-icon.cjs");
const MartiniIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MartiniIcon", [["path", { "d": "M12 12 4.207 4.207A.707.707 0 0 1 4.707 3h14.586a.707.707 0 0 1 .5 1.207z" }], ["path", { "d": "M12 12v10" }], ["path", { "d": "M7 22h10" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MartiniIcon
});
