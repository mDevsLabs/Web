"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
function UploadProgress({ name, progress, status = "uploading", onCancel }) {
  const value = Math.max(0, Math.min(100, progress));
  return /* @__PURE__ */ jsxs("div", { className: "md-glass md-upload-progress", children: [
    /* @__PURE__ */ jsxs("div", { className: "md-domain-heading", children: [
      /* @__PURE__ */ jsx("strong", { children: name }),
      /* @__PURE__ */ jsx("span", { children: status === "error" ? "\xC9chec" : status === "complete" ? "Termin\xE9" : `${Math.round(value)} %` })
    ] }),
    /* @__PURE__ */ jsx("div", { role: "progressbar", "aria-label": name, "aria-valuenow": value, "aria-valuemin": 0, "aria-valuemax": 100, className: "md-progress", children: /* @__PURE__ */ jsx("span", { style: { width: `${value}%` } }) }),
    onCancel && status === "uploading" && /* @__PURE__ */ jsx("button", { type: "button", className: "md-button md-button-ghost", onClick: onCancel, children: "Annuler" })
  ] });
}
export {
  UploadProgress
};
