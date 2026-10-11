"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { createContext, useContext } from "react";
const ThemeContext = createContext({ theme: "system", glass: true, variant: "liquid-glass" });
function PortalScope({ children }) {
  const { theme, glass, variant, accent, radius, variables } = useContext(ThemeContext);
  return /* @__PURE__ */ jsx("div", { className: "md-root md-portal-scope", "data-md-theme": theme, "data-md-glass": glass ? "on" : "off", "data-md-variant": variant, style: { ...variables, ...accent ? { "--md-accent": accent } : {}, ...radius ? { "--md-radius": radius } : {} }, children });
}
export {
  PortalScope,
  ThemeContext
};
