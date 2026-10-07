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
var adjustments_question_exports = {};
__export(adjustments_question_exports, {
  AdjustmentsQuestionIcon: () => AdjustmentsQuestionIcon
});
module.exports = __toCommonJS(adjustments_question_exports);
var import_create_icon = require("../../create-icon.cjs");
const AdjustmentsQuestionIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AdjustmentsQuestionIcon", [["path", { "d": "M4 10a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" }], ["path", { "d": "M6 4v4" }], ["path", { "d": "M6 12v8" }], ["path", { "d": "M13.577 14.77a2 2 0 1 0 .117 2.295" }], ["path", { "d": "M12 4v10" }], ["path", { "d": "M19 22v.01" }], ["path", { "d": "M19 19a2.003 2.003 0 0 0 .914 -3.782a1.98 1.98 0 0 0 -2.414 .483" }], ["path", { "d": "M12 18v2" }], ["path", { "d": "M16 7a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" }], ["path", { "d": "M18 4v1" }], ["path", { "d": "M18 9v2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AdjustmentsQuestionIcon
});
