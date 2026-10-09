"use client";
import { useState } from "react";
function cx(...values) {
  return values.filter(Boolean).join(" ");
}
function useControllable(value, fallback, onChange) {
  const [internal, setInternal] = useState(fallback);
  const current = value === void 0 ? internal : value;
  const update = (next) => {
    if (value === void 0)
      setInternal(next);
    onChange?.(next);
  };
  return [current, update];
}
export {
  cx,
  useControllable
};
