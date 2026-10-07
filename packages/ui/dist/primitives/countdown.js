"use client";
"use client";
import { jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { cx } from "../internal/utils.js";
function Countdown({ seconds, label = "Temps restant", onElapsed, className, ...props }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0)));
  const latest = useRef(onElapsed);
  useEffect(() => {
    latest.current = onElapsed;
  }, [onElapsed]);
  useEffect(() => {
    let value = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
    setRemaining(value);
    if (!value)
      return;
    const timer = setInterval(() => {
      value -= 1;
      setRemaining(value);
      if (value <= 0) {
        clearInterval(timer);
        latest.current?.();
      }
    }, 1e3);
    return () => clearInterval(timer);
  }, [seconds]);
  return /* @__PURE__ */ jsxs("span", { ...props, role: "timer", "aria-label": label, "aria-live": "off", className: cx("md-countdown", className), children: [
    Math.floor(remaining / 60).toString().padStart(2, "0"),
    ":",
    (remaining % 60).toString().padStart(2, "0")
  ] });
}
export {
  Countdown
};
