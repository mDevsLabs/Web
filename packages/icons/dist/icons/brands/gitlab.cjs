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
var gitlab_exports = {};
__export(gitlab_exports, {
  GitlabIcon: () => GitlabIcon
});
module.exports = __toCommonJS(gitlab_exports);
var import_create_icon = require("../../create-icon.js");
const GitlabIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("GitlabIcon", [
  ["path", { d: "m22 13.29-1.33-4.14a1.07 1.07 0 0 0-2-.08L17.2 13H6.8l-1.47-3.93a1.07 1.07 0 0 0-2 .08L2 13.29a1.07 1.07 0 0 0 .38 1.15l9.15 6.64a1 1 0 0 0 1.18 0l9.15-6.64a1.07 1.07 0 0 0 .14-1.15z" }]
]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GitlabIcon
});
