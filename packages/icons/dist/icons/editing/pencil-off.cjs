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
var pencil_off_exports = {};
__export(pencil_off_exports, {
  PencilOffIcon: () => PencilOffIcon
});
module.exports = __toCommonJS(pencil_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const PencilOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PencilOffIcon", [["path", { "d": "m10 10-6.157 6.162a2 2 0 0 0-.5.833l-1.322 4.36a.5.5 0 0 0 .622.624l4.358-1.323a2 2 0 0 0 .83-.5L14 13.982" }], ["path", { "d": "m12.829 7.172 4.359-4.346a1 1 0 1 1 3.986 3.986l-4.353 4.353" }], ["path", { "d": "m15 5 4 4" }], ["path", { "d": "m2 2 20 20" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PencilOffIcon
});
