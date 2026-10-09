"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
import { ThemeContext } from "../internal/theme.js";
function ThemeProvider({ theme = "system", accent, radius, glass = true, className, style, ...props }) {
  return /* @__PURE__ */ jsx(ThemeContext.Provider, { value: { theme, accent, radius, glass, variables: Object.fromEntries(Object.entries(style ?? {}).filter(([key]) => key.startsWith("--"))) }, children: /* @__PURE__ */ jsx("div", { ...props, className: cx("md-root", className), "data-md-theme": theme, "data-md-glass": glass ? "on" : "off", style: { ...style, ...accent ? { "--md-accent": accent } : {}, ...radius ? { "--md-radius": radius } : {} } }) });
}
export {
  ThemeProvider
};
