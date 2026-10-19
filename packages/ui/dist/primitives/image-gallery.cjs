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
var image_gallery_exports = {};
__export(image_gallery_exports, {
  ImageGallery: () => ImageGallery
});
module.exports = __toCommonJS(image_gallery_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function ImageGallery({ label, images, value, onValueChange, className, ...props }) {
  const [failed, setFailed] = (0, import_react.useState)(false);
  const current = images.find((image) => image.id === value) ?? images[0];
  (0, import_react.useEffect)(() => setFailed(false), [current?.src]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ...props, className: (0, import_utils.cx)("md-image-gallery", className), role: "group", "aria-label": label, children: current ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", { children: [
      failed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { role: "status", children: [
        "L\u2019image n\u2019a pas pu \xEAtre charg\xE9e : ",
        current.alt
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: current.src, alt: current.alt, onError: () => setFailed(true) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("figcaption", { children: current.caption ?? current.alt })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "md-gallery-thumbnails", children: images.map((image) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", "aria-label": `Afficher : ${image.alt}`, "aria-pressed": image.id === current.id, onClick: () => onValueChange(image.id), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: image.src, alt: "", loading: "lazy" }) }, image.id)) })
  ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Aucune image." }) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ImageGallery
});
