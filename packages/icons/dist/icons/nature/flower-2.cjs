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
var flower_2_exports = {};
__export(flower_2_exports, {
  Flower2Icon: () => Flower2Icon
});
module.exports = __toCommonJS(flower_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const Flower2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Flower2Icon", [["path", { "d": "M12 5a3 3 0 1 1 3 3m-3-3a3 3 0 1 0-3 3m3-3v1M9 8a3 3 0 1 0 3 3M9 8h1m5 0a3 3 0 1 1-3 3m3-3h-1m-2 3v-1" }], ["circle", { "cx": "12", "cy": "8", "r": "2" }], ["path", { "d": "M12 10v12" }], ["path", { "d": "M12 22c4.2 0 7-1.667 7-5-4.2 0-7 1.667-7 5Z" }], ["path", { "d": "M12 22c-4.2 0-7-1.667-7-5 4.2 0 7 1.667 7 5Z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Flower2Icon
});
