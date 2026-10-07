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
var camera_question_exports = {};
__export(camera_question_exports, {
  CameraQuestionIcon: () => CameraQuestionIcon
});
module.exports = __toCommonJS(camera_question_exports);
var import_create_icon = require("../../create-icon.cjs");
const CameraQuestionIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CameraQuestionIcon", [["path", { "d": "M15 20h-10a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2h1a2 2 0 0 0 2 -2a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v2.5" }], ["path", { "d": "M14.975 12.612a3 3 0 1 0 -1.507 3.005" }], ["path", { "d": "M19 22v.01" }], ["path", { "d": "M19 19a2.003 2.003 0 0 0 .914 -3.782a1.98 1.98 0 0 0 -2.414 .483" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CameraQuestionIcon
});
