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
var mop_sparkles_exports = {};
__export(mop_sparkles_exports, {
  MopSparklesIcon: () => MopSparklesIcon
});
module.exports = __toCommonJS(mop_sparkles_exports);
var import_create_icon = require("../../create-icon.cjs");
const MopSparklesIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MopSparklesIcon", [["path", { "d": "M10 22a3 3 0 01-3-3" }], ["path", { "d": "M10 22c2.761 0 5-1.79 5-4-4.42 0-4.08-5-8.5-5a4.501 4.501 0 000 9z" }], ["path", { "d": "M10 3H8" }], ["path", { "d": "M12.5 11.5 22 2" }], ["path", { "d": "M20 13v4" }], ["path", { "d": "M22 15h-4" }], ["path", { "d": "M4 5v4" }], ["path", { "d": "M6 7H2" }], ["path", { "d": "m6.98 13.02 2.665-2.664a1.21 1.21 0 011.71 0l2.29 2.288a1.21 1.21 0 010 1.712l-2.088 2.087" }], ["path", { "d": "M9 2v2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MopSparklesIcon
});
