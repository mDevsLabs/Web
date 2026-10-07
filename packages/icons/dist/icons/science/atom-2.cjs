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
var atom_2_exports = {};
__export(atom_2_exports, {
  Atom2Icon: () => Atom2Icon
});
module.exports = __toCommonJS(atom_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const Atom2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Atom2Icon", [["path", { "d": "M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" }], ["path", { "d": "M12 21l0 .01" }], ["path", { "d": "M3 9l0 .01" }], ["path", { "d": "M21 9l0 .01" }], ["path", { "d": "M8 20.1a9 9 0 0 1 -5 -7.1" }], ["path", { "d": "M16 20.1a9 9 0 0 0 5 -7.1" }], ["path", { "d": "M6.2 5a9 9 0 0 1 11.4 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Atom2Icon
});
