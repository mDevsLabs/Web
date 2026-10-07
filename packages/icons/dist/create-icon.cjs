"use client";
"use strict";
"use client";
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
var create_icon_exports = {};
__export(create_icon_exports, {
  createIcon: () => createIcon
});
module.exports = __toCommonJS(create_icon_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
function createIcon(displayName, nodes) {
  const Icon = (0, import_react.forwardRef)(function Icon2({ size = 24, title, absoluteStrokeWidth = false, children, strokeWidth = 1.5, color, style, ...props }, ref) {
    const generated = (0, import_react.useId)();
    const titleId = `${generated}-title`;
    const labelled = Boolean(title || props["aria-label"] || props["aria-labelledby"]);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { xmlns: "http://www.w3.org/2000/svg", width: size, height: size, viewBox: "0 0 24 24", fill: "none", color: color ?? "#000", style: { colorScheme: "light dark", color: color ?? "var(--md-icon-color, light-dark(#000, #fff))", ...style }, stroke: "currentColor", strokeWidth, strokeLinecap: "round", strokeLinejoin: "round", role: labelled ? "img" : void 0, "aria-hidden": labelled ? void 0 : true, "aria-labelledby": title ? titleId : void 0, focusable: "false", ...props, ref, children: [
      title && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("title", { id: titleId, children: title }),
      nodes.map(([tag, attrs], index) => (0, import_react.createElement)(tag, { ...attrs, ...absoluteStrokeWidth ? { vectorEffect: "non-scaling-stroke" } : {}, key: index })),
      children
    ] });
  });
  Icon.displayName = displayName;
  return Icon;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createIcon
});
