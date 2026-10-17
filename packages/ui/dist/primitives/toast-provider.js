"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useId, useRef, useState } from "react";
const ToastContext = createContext(null);
function useToast() {
  const context = useContext(ToastContext);
  if (!context)
    throw new Error("useToast requires ToastProvider");
  return context;
}
function ToastProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const timers = useRef(/* @__PURE__ */ new Map());
  const sequence = useRef(0);
  const prefix = useId();
  function dismiss(id) {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setMessages((previous) => previous.filter((m) => m.id !== id));
  }
  useEffect(() => () => {
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
  return /* @__PURE__ */ jsxs(ToastContext.Provider, { value: { notify, dismiss }, children: [
    children,
    /* @__PURE__ */ jsx("div", { className: "md-toasts", "aria-live": "polite", "aria-atomic": "false", "aria-relevant": "additions", children: /* @__PURE__ */ jsx("ol", { children: messages.map((message) => /* @__PURE__ */ jsxs("li", { className: "md-glass md-toast", "data-tone": message.tone, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("strong", { children: message.title }),
        message.description && /* @__PURE__ */ jsx("p", { children: message.description })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "md-close", "aria-label": "Fermer la notification", onClick: () => dismiss(message.id), children: "\xD7" })
    ] }, message.id)) }) })
  ] });
}
export {
  ToastProvider,
  useToast
};
