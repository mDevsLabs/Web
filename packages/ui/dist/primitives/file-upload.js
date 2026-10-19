"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId, useState } from "react";
import { cx } from "../internal/utils.js";
function FileUpload({ label, onFilesChange, id, className, ...props }) {
  const generated = useId();
  const [names, setNames] = useState([]);
  return /* @__PURE__ */ jsxs("div", { className: cx("md-upload md-glass", className), children: [
    /* @__PURE__ */ jsx("label", { htmlFor: id ?? generated, children: label }),
    /* @__PURE__ */ jsx("input", { ...props, id: id ?? generated, type: "file", onChange: (e) => {
      const files = Array.from(e.target.files ?? []);
      setNames(files.map((f) => f.name));
      onFilesChange?.(files);
    } }),
    names.length > 0 && /* @__PURE__ */ jsx("ul", { children: names.map((name, i) => /* @__PURE__ */ jsx("li", { children: name }, `${name}-${i}`)) })
  ] });
}
export {
  FileUpload
};
