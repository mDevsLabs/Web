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
var disc_golf_exports = {};
__export(disc_golf_exports, {
  DiscGolfIcon: () => DiscGolfIcon
});
module.exports = __toCommonJS(disc_golf_exports);
var import_create_icon = require("../../create-icon.cjs");
const DiscGolfIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("DiscGolfIcon", [["path", { "d": "M5 5h14" }], ["path", { "d": "M6 5c.32 6.744 2.74 9.246 6 10" }], ["path", { "d": "M18 5c-.32 6.744 -2.74 9.246 -6 10" }], ["path", { "d": "M10 5c0 4.915 .552 7.082 2 10" }], ["path", { "d": "M14 5c0 4.915 -.552 7.082 -2 10" }], ["path", { "d": "M12 15v6" }], ["path", { "d": "M12 3v2" }], ["path", { "d": "M7 16c.64 .64 1.509 1 2.414 1h5.172c.905 0 1.774 -.36 2.414 -1" }], ["path", { "d": "M11 21h2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DiscGolfIcon
});
