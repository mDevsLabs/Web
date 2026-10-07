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
var api_app_off_exports = {};
__export(api_app_off_exports, {
  ApiAppOffIcon: () => ApiAppOffIcon
});
module.exports = __toCommonJS(api_app_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const ApiAppOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ApiAppOffIcon", [["path", { "d": "M12 15h-6.5a2.5 2.5 0 1 1 0 -5h.5" }], ["path", { "d": "M15 15v3.5a2.5 2.5 0 1 1 -5 0v-.5" }], ["path", { "d": "M13 9h5.5a2.5 2.5 0 1 1 0 5h-.5" }], ["path", { "d": "M9 12v-3m.042 -3.957a2.5 2.5 0 0 1 4.958 .457v.5" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ApiAppOffIcon
});
