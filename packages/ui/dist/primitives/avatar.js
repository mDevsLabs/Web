"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { cx } from "../internal/utils.js";
function Avatar({ src, name, size = 40, style, className, ...props }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return /* @__PURE__ */ jsx("span", { ...props, role: "img", "aria-label": name, className: cx("md-avatar", className), style: { width: size, height: size, ...style }, children: src && !failed ? /* @__PURE__ */ jsx("img", { src, alt: "", onError: () => setFailed(true) }) : /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: name.trim().split(/\s+/).slice(0, 2).map((n) => n[0]).join("").toUpperCase() }) });
}
export {
  Avatar
};
