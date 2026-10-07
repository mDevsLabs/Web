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
var circle_half_2_exports = {};
__export(circle_half_2_exports, {
  CircleHalf2Icon: () => CircleHalf2Icon
});
module.exports = __toCommonJS(circle_half_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const CircleHalf2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CircleHalf2Icon", [["path", { "d": "M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" }], ["path", { "d": "M12 3v18" }], ["path", { "d": "M12 14l7 -7" }], ["path", { "d": "M12 19l8.5 -8.5" }], ["path", { "d": "M12 9l4.5 -4.5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CircleHalf2Icon
});
