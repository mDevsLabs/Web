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
var dental_off_exports = {};
__export(dental_off_exports, {
  DentalOffIcon: () => DentalOffIcon
});
module.exports = __toCommonJS(dental_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const DentalOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("DentalOffIcon", [["path", { "d": "M19.277 15.281c.463 -1.75 .723 -3.844 .723 -6.281c0 -3.74 -1.908 -5 -4 -5c-1.423 0 -2.92 .911 -4 1.5c-1.074 -.586 -2.583 -1.5 -4 -1.5m-2.843 1.153c-.707 .784 -1.157 2.017 -1.157 3.847c0 4.899 1.056 8.41 2.671 10.537c.573 .756 1.97 .521 2.567 -.236c.398 -.505 .819 -1.439 1.262 -2.801c.292 -.771 .892 -1.504 1.5 -1.5c.602 0 1.21 .737 1.5 1.5c.443 1.362 .864 2.295 1.262 2.8c.597 .759 2 .993 2.567 .237c.305 -.402 .59 -.853 .852 -1.353" }], ["path", { "d": "M12 5.5l3 1.5" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DentalOffIcon
});
