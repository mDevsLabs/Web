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
var function_off_exports = {};
__export(function_off_exports, {
  FunctionOffIcon: () => FunctionOffIcon
});
module.exports = __toCommonJS(function_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const FunctionOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FunctionOffIcon", [["path", { "d": "M9 15.5v.25c0 .69 .56 1.25 1.25 1.25a1.38 1.38 0 0 0 1.374 -1.244l.376 -3.756m.363 -3.63l.013 -.126a1.38 1.38 0 0 1 1.374 -1.244c.69 0 1.25 .56 1.25 1.25v.25" }], ["path", { "d": "M8 4h10a2 2 0 0 1 2 2v10m-.586 3.414a2 2 0 0 1 -1.414 .586h-12a2 2 0 0 1 -2 -2v-12c0 -.547 .22 -1.043 .576 -1.405" }], ["path", { "d": "M9 12h3" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FunctionOffIcon
});
