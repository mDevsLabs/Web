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
var bug_off_exports = {};
__export(bug_off_exports, {
  BugOffIcon: () => BugOffIcon
});
module.exports = __toCommonJS(bug_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const BugOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BugOffIcon", [["path", { "d": "M12 20v-8" }], ["path", { "d": "M12.656 7H14a4 4 0 0 1 4 4v1.344" }], ["path", { "d": "M14.12 3.88 16 2" }], ["path", { "d": "M17.123 17.123A6 6 0 0 1 6 14v-3a4 4 0 0 1 1.72-3.287" }], ["path", { "d": "m2 2 20 20" }], ["path", { "d": "M21 5a4 4 0 0 1-3.55 3.97" }], ["path", { "d": "M22 13h-3.344" }], ["path", { "d": "M3 21a4 4 0 0 1 3.81-4" }], ["path", { "d": "M3 5a4 4 0 0 0 3.55 3.97" }], ["path", { "d": "M6 13H2" }], ["path", { "d": "m8 2 1.88 1.88" }], ["path", { "d": "M9.712 4.06A3 3 0 0 1 15 6v1.13" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BugOffIcon
});
