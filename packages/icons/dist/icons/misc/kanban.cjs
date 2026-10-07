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
var kanban_exports = {};
__export(kanban_exports, {
  KanbanIcon: () => KanbanIcon
});
module.exports = __toCommonJS(kanban_exports);
var import_create_icon = require("../../create-icon.cjs");
const KanbanIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("KanbanIcon", [["path", { "d": "M5 3v14" }], ["path", { "d": "M12 3v8" }], ["path", { "d": "M19 3v18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  KanbanIcon
});
