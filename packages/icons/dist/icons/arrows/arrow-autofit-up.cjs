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
var arrow_autofit_up_exports = {};
__export(arrow_autofit_up_exports, {
  ArrowAutofitUpIcon: () => ArrowAutofitUpIcon
});
module.exports = __toCommonJS(arrow_autofit_up_exports);
var import_create_icon = require("../../create-icon.js");
const ArrowAutofitUpIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ArrowAutofitUpIcon", [["path", { "d": "M12 4h-6a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h8" }], ["path", { "d": "M18 20v-17" }], ["path", { "d": "M15 6l3 -3l3 3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ArrowAutofitUpIcon
});
