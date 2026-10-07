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
var calendar_fold_exports = {};
__export(calendar_fold_exports, {
  CalendarFoldIcon: () => CalendarFoldIcon
});
module.exports = __toCommonJS(calendar_fold_exports);
var import_create_icon = require("../../create-icon.cjs");
const CalendarFoldIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CalendarFoldIcon", [["path", { "d": "M16 2v3" }], ["path", { "d": "M21 15V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h10v-5a1 1 0 011-1za2.4 2.4 0 01-.706 1.706l-3.588 3.588A2.4 2.4 0 0115 21" }], ["path", { "d": "M3 9h18" }], ["path", { "d": "M8 2v3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CalendarFoldIcon
});
