"use client";
"use client";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { cx } from "../internal/utils.js";
function ImageGallery({ label, images, value, onValueChange, className, ...props }) {
  const [failed, setFailed] = useState(false);
  const current = images.find((image) => image.id === value) ?? images[0];
  useEffect(() => setFailed(false), [current?.src]);
  return /* @__PURE__ */ jsx("div", { ...props, className: cx("md-image-gallery", className), role: "group", "aria-label": label, children: current ? /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("figure", { children: [
      failed ? /* @__PURE__ */ jsxs("p", { role: "status", children: [
        "L\u2019image n\u2019a pas pu \xEAtre charg\xE9e : ",
        current.alt
      ] }) : /* @__PURE__ */ jsx("img", { src: current.src, alt: current.alt, onError: () => setFailed(true) }),
      /* @__PURE__ */ jsx("figcaption", { children: current.caption ?? current.alt })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "md-gallery-thumbnails", children: images.map((image) => /* @__PURE__ */ jsx("button", { type: "button", "aria-label": `Afficher : ${image.alt}`, "aria-pressed": image.id === current.id, onClick: () => onValueChange(image.id), children: /* @__PURE__ */ jsx("img", { src: image.src, alt: "", loading: "lazy" }) }, image.id)) })
  ] }) : /* @__PURE__ */ jsx("p", { children: "Aucune image." }) });
}
export {
  ImageGallery
};
