"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { createContext, useContext } from "react";
const ThemeContext = createContext({ theme: "system", glass: true });
function PortalScope({ children }) {
  const { theme, glass, accent, radius, variables } = useContext(ThemeContext);
  return /* @__PURE__ */ jsx("div", { className: "md-root md-portal-scope", "data-md-theme": theme, "data-md-glass": glass ? "on" : "off", style: { ...variables, ...accent ? { "--md-accent": accent } : {}, ...radius ? { "--md-radius": radius } : {} }, children });
}
export {
  PortalScope,
  ThemeContext
};
