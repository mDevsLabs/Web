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
var file_question_mark_exports = {};
__export(file_question_mark_exports, {
  FileQuestionMarkIcon: () => FileQuestionMarkIcon
});
module.exports = __toCommonJS(file_question_mark_exports);
var import_create_icon = require("../../create-icon.cjs");
const FileQuestionMarkIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FileQuestionMarkIcon", [["path", { "d": "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" }], ["path", { "d": "M12 17h.01" }], ["path", { "d": "M9.1 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FileQuestionMarkIcon
});
