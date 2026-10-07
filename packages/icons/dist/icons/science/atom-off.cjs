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
var atom_off_exports = {};
__export(atom_off_exports, {
  AtomOffIcon: () => AtomOffIcon
});
module.exports = __toCommonJS(atom_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const AtomOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AtomOffIcon", [["path", { "d": "M12 12v.01" }], ["path", { "d": "M9.172 9.172c-3.906 3.905 -5.805 8.337 -4.243 9.9c1.562 1.561 6 -.338 9.9 -4.244m1.884 -2.113c2.587 -3.277 3.642 -6.502 2.358 -7.786c-1.284 -1.284 -4.508 -.23 -7.784 2.357" }], ["path", { "d": "M4.929 4.929c-1.562 1.562 .337 6 4.243 9.9c3.905 3.905 8.337 5.804 9.9 4.242m-.072 -4.071c-.767 -1.794 -2.215 -3.872 -4.172 -5.828c-1.944 -1.945 -4.041 -3.402 -5.828 -4.172" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AtomOffIcon
});
