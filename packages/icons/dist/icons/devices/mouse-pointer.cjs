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
var mouse_pointer_exports = {};
__export(mouse_pointer_exports, {
  MousePointerIcon: () => MousePointerIcon
});
module.exports = __toCommonJS(mouse_pointer_exports);
var import_create_icon = require("../../create-icon.cjs");
const MousePointerIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MousePointerIcon", [["path", { "d": "M12.586 12.586 19 19" }], ["path", { "d": "M3.688 3.037a.497.497 0 0 0-.651.651l6.5 15.999a.501.501 0 0 0 .947-.062l1.569-6.083a2 2 0 0 1 1.448-1.479l6.124-1.579a.5.5 0 0 0 .063-.947z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MousePointerIcon
});
