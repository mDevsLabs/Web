"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId, useState } from "react";
import { cx } from "../internal/utils.js";
function FileDropzone({ label, onFiles, onRejected, accept, multiple = false, maxBytes = 10 * 1024 * 1024, disabled, className, ...props }) {
  const id = useId();
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const select = (files) => {
    if (disabled)
      return;
    const candidate = multiple ? files : files.slice(0, 1);
    const rejected = candidate.filter((file) => file.size > maxBytes);
    const valid = candidate.filter((file) => file.size <= maxBytes);
    setError(rejected.length ? `${rejected.length} fichier(s) d\xE9passe(nt) la taille autoris\xE9e.` : "");
    if (rejected.length)
      onRejected?.(rejected);
    if (valid.length)
      onFiles(valid);
  };
  return /* @__PURE__ */ jsxs("div", { ...props, className: cx("md-dropzone", className), "data-dragging": dragging || void 0, onDragOver: (event) => {
    event.preventDefault();
    if (!disabled)
      setDragging(true);
  }, onDragLeave: (event) => {
    if (!event.currentTarget.contains(event.relatedTarget))
      setDragging(false);
  }, onDrop: (event) => {
    event.preventDefault();
    setDragging(false);
    select(Array.from(event.dataTransfer.files));
  }, children: [
    /* @__PURE__ */ jsx("label", { htmlFor: id, children: label }),
    /* @__PURE__ */ jsx("p", { className: "md-muted", children: "D\xE9posez ici ou utilisez le s\xE9lecteur de fichiers." }),
    /* @__PURE__ */ jsx("input", { id, type: "file", accept, multiple, disabled, "aria-describedby": error ? `${id}-error` : void 0, onChange: (event) => {
      select(Array.from(event.target.files ?? []));
      event.target.value = "";
    } }),
    error && /* @__PURE__ */ jsx("p", { id: `${id}-error`, role: "alert", className: "md-field-error", children: error })
  ] });
}
export {
  FileDropzone
};
