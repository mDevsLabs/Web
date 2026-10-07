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
var nut_off_exports = {};
__export(nut_off_exports, {
  NutOffIcon: () => NutOffIcon
});
module.exports = __toCommonJS(nut_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const NutOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("NutOffIcon", [["path", { "d": "M11.868 11.868a.88.88 0 01-.488.252c-1.78.28-3.54-.17-4.88-.62 0 1.272-.229 3.578-.653 5.347a10 10 0 01-.417 1.363c-.21.52-.82.55-1.17.12a10 10 0 01.677-13.393" }], ["path", { "d": "M12.14 6.485a27.4 27.4 0 004.707-.638L20 9a7.23 7.23 0 011.706 7.05" }], ["path", { "d": "m2 2 20 20" }], ["path", { "d": "M20.707 20.707A1 1 0 0120 21h-1c-1.069 0-1.648.242-2.485.552A7.2 7.2 0 019.002 20l-3.155-3.153" }], ["path", { "d": "M8.356 2.7a10 10 0 019.974 1.56c.43.35.4.97-.12 1.17a10 10 0 01-1.363.417" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NutOffIcon
});
