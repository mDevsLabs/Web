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
var utils_exports = {};
__export(utils_exports, {
  cx: () => cx,
  useControllable: () => useControllable
});
module.exports = __toCommonJS(utils_exports);
var import_react = require("react");
function cx(...values) {
  return values.filter(Boolean).join(" ");
}
function useControllable(value, fallback, onChange) {
  const [internal, setInternal] = (0, import_react.useState)(fallback);
  const current = value === void 0 ? internal : value;
  const update = (next) => {
    if (value === void 0)
      setInternal(next);
    onChange?.(next);
  };
  return [current, update];
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  cx,
  useControllable
});
