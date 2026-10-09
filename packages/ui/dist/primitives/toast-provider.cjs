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
var toast_provider_exports = {};
__export(toast_provider_exports, {
  ToastProvider: () => ToastProvider,
  useToast: () => useToast
});
module.exports = __toCommonJS(toast_provider_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
const ToastContext = (0, import_react.createContext)(null);
function useToast() {
  const context = (0, import_react.useContext)(ToastContext);
  if (!context)
    throw new Error("useToast requires ToastProvider");
  return context;
}
function ToastProvider({ children }) {
  const [messages, setMessages] = (0, import_react.useState)([]);
  const timers = (0, import_react.useRef)(/* @__PURE__ */ new Map());
  const sequence = (0, import_react.useRef)(0);
  const prefix = (0, import_react.useId)();
  function dismiss(id) {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setMessages((previous) => previous.filter((m) => m.id !== id));
  }
  (0, import_react.useEffect)(() => () => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
  }, []);
  function notify(input) {
    const id = `${prefix}-${++sequence.current}`;
    setMessages((previous) => [...previous.slice(-2), { ...input, id }]);
    if ((input.duration ?? 5e3) > 0)
      timers.current.set(id, setTimeout(() => dismiss(id), input.duration ?? 5e3));
    return id;
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ToastContext.Provider, { value: { notify, dismiss }, children: [
    children,
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "md-toasts", "aria-live": "polite", "aria-atomic": "false", "aria-relevant": "additions", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", { children: messages.map((message) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { className: "md-glass md-toast", "data-tone": message.tone, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: message.title }),
        message.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: message.description })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "md-close", "aria-label": "Fermer la notification", onClick: () => dismiss(message.id), children: "\xD7" })
    ] }, message.id)) }) })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ToastProvider,
  useToast
});
