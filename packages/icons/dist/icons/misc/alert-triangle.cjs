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
var alert_triangle_exports = {};
__export(alert_triangle_exports, {
  AlertTriangleIcon: () => AlertTriangleIcon
});
module.exports = __toCommonJS(alert_triangle_exports);
var import_create_icon = require("../../create-icon.cjs");
const AlertTriangleIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AlertTriangleIcon", [["path", { "d": "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" }], ["path", { "d": "M12 9v4" }], ["path", { "d": "M12 17h.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AlertTriangleIcon
});
