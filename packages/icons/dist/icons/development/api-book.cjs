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
var api_book_exports = {};
__export(api_book_exports, {
  ApiBookIcon: () => ApiBookIcon
});
module.exports = __toCommonJS(api_book_exports);
var import_create_icon = require("../../create-icon.cjs");
const ApiBookIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ApiBookIcon", [["path", { "d": "M3 19a9 9 0 0 1 9 0a9 9 0 0 1 1.006 -.5" }], ["path", { "d": "M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0" }], ["path", { "d": "M3 6v13" }], ["path", { "d": "M12 6v13" }], ["path", { "d": "M21 6v6" }], ["path", { "d": "M17.001 19a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M19.001 15.5v1.5" }], ["path", { "d": "M19.001 21v1.5" }], ["path", { "d": "M22.032 17.25l-1.299 .75" }], ["path", { "d": "M17.27 20l-1.3 .75" }], ["path", { "d": "M15.97 17.25l1.3 .75" }], ["path", { "d": "M20.733 20l1.3 .75" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ApiBookIcon
});
