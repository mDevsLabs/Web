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
var drop_circle_exports = {};
__export(drop_circle_exports, {
  DropCircleIcon: () => DropCircleIcon
});
module.exports = __toCommonJS(drop_circle_exports);
var import_create_icon = require("../../create-icon.cjs");
const DropCircleIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("DropCircleIcon", [["path", { "d": "M10.07 15.34c1.115 .88 2.74 .88 3.855 0c1.115 -.88 1.398 -2.388 .671 -3.575l-2.596 -3.765l-2.602 3.765c-.726 1.187 -.443 2.694 .672 3.575" }], ["path", { "d": "M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DropCircleIcon
});
