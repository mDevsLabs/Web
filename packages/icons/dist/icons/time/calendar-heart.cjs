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
var calendar_heart_exports = {};
__export(calendar_heart_exports, {
  CalendarHeartIcon: () => CalendarHeartIcon
});
module.exports = __toCommonJS(calendar_heart_exports);
var import_create_icon = require("../../create-icon.cjs");
const CalendarHeartIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CalendarHeartIcon", [["path", { "d": "M12.127 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v5.125" }], ["path", { "d": "M14.62 17.8A2.25 2.25 0 1118 14.836a2.25 2.25 0 113.38 2.966l-2.626 2.856a.998.998 0 01-1.507 0z" }], ["path", { "d": "M16 2v3" }], ["path", { "d": "M3 9h18" }], ["path", { "d": "M8 2v3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CalendarHeartIcon
});
