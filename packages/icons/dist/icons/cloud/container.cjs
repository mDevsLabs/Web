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
var container_exports = {};
__export(container_exports, {
  ContainerIcon: () => ContainerIcon
});
module.exports = __toCommonJS(container_exports);
var import_create_icon = require("../../create-icon.cjs");
const ContainerIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ContainerIcon", [["path", { "d": "M22 7.7c0-.6-.4-1.2-.8-1.5l-6.3-3.9a1.72 1.72 0 0 0-1.7 0l-10.3 6c-.5.2-.9.8-.9 1.4v6.6c0 .5.4 1.2.8 1.5l6.3 3.9a1.72 1.72 0 0 0 1.7 0l10.3-6c.5-.3.9-1 .9-1.5Z" }], ["path", { "d": "M10 21.9V14L2.1 9.1" }], ["path", { "d": "m10 14 11.9-6.9" }], ["path", { "d": "M14 19.8v-8.1" }], ["path", { "d": "M18 17.5V9.4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ContainerIcon
});
