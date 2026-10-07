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
var book_alert_exports = {};
__export(book_alert_exports, {
  BookAlertIcon: () => BookAlertIcon
});
module.exports = __toCommonJS(book_alert_exports);
var import_create_icon = require("../../create-icon.cjs");
const BookAlertIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BookAlertIcon", [["path", { "d": "M12 13h.01" }], ["path", { "d": "M12 6v3" }], ["path", { "d": "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BookAlertIcon
});
