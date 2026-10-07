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
var form_input_exports = {};
__export(form_input_exports, {
  FormInputIcon: () => FormInputIcon
});
module.exports = __toCommonJS(form_input_exports);
var import_create_icon = require("../../create-icon.cjs");
const FormInputIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FormInputIcon", [["rect", { "width": "20", "height": "12", "x": "2", "y": "6", "rx": "2" }], ["path", { "d": "M12 12h.01" }], ["path", { "d": "M17 12h.01" }], ["path", { "d": "M7 12h.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FormInputIcon
});
