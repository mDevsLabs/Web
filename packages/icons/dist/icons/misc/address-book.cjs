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
var address_book_exports = {};
__export(address_book_exports, {
  AddressBookIcon: () => AddressBookIcon
});
module.exports = __toCommonJS(address_book_exports);
var import_create_icon = require("../../create-icon.cjs");
const AddressBookIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AddressBookIcon", [["path", { "d": "M20 6v12a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2" }], ["path", { "d": "M10 16h6" }], ["path", { "d": "M11 11a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M4 8h3" }], ["path", { "d": "M4 12h3" }], ["path", { "d": "M4 16h3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AddressBookIcon
});
