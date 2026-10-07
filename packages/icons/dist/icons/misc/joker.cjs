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
var joker_exports = {};
__export(joker_exports, {
  JokerIcon: () => JokerIcon
});
module.exports = __toCommonJS(joker_exports);
var import_create_icon = require("../../create-icon.cjs");
const JokerIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("JokerIcon", [["path", { "d": "M5 17.5a1.5 1.5 0 0 1 1.5 -1.5h11a1.5 1.5 0 0 1 1.5 1.5a1.5 1.5 0 0 1 -1.5 1.5h-11a1.5 1.5 0 0 1 -1.5 -1.5" }], ["path", { "d": "M12 16q -2.5 -8 -6 -8q -2.5 0 -3 2c2.953 .31 3.308 3.33 4 6" }], ["path", { "d": "M12 16q 2.5 -8 6 -8q 2.5 0 3 2c-2.953 .31 -3.308 3.33 -4 6" }], ["path", { "d": "M9 9.5q 2 -3.5 3 -3.5t 3 3.5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  JokerIcon
});
