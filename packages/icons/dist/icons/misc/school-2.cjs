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
var school_2_exports = {};
__export(school_2_exports, {
  School2Icon: () => School2Icon
});
module.exports = __toCommonJS(school_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const School2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("School2Icon", [["path", { "d": "M14 21v-3a2 2 0 0 0-4 0v3" }], ["path", { "d": "M18 12h.01" }], ["path", { "d": "M18 16h.01" }], ["path", { "d": "M22 7a1 1 0 0 0-1-1h-2a2 2 0 0 1-1.143-.359L13.143 2.36a2 2 0 0 0-2.286-.001L6.143 5.64A2 2 0 0 1 5 6H3a1 1 0 0 0-1 1v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2z" }], ["path", { "d": "M6 12h.01" }], ["path", { "d": "M6 16h.01" }], ["circle", { "cx": "12", "cy": "10", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  School2Icon
});
