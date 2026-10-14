"use client";
// La couleur vient du contrôle parent pour préserver le contraste et ses états.
// Note : aucune syntaxe JSX ici, uniquement `createElement` — voir
// `src/create-icon.tsx`. Cela évite un import de `react/jsx-runtime` dans le
// livrable, sous-chemin fragile pour les consommateurs liés via `file:`.
import { createElement, forwardRef, useId } from "react";
function createIcon(displayName, nodes) {
  const Icon = forwardRef(function Icon2({ size = 24, title, absoluteStrokeWidth = false, children, strokeWidth = 1.5, color, style, ...props }, ref) {
    const generated = useId();
    const titleId = `${generated}-title`;
    const labelled = Boolean(title || props["aria-label"] || props["aria-labelledby"]);
    return /* @__PURE__ */ createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: size, height: size, viewBox: "0 0 24 24", fill: "none", color, style, stroke: "currentColor", strokeWidth, strokeLinecap: "round", strokeLinejoin: "round", role: labelled ? "img" : void 0, "aria-hidden": labelled ? void 0 : true, "aria-labelledby": title ? titleId : void 0, focusable: "false", ...props, ref }, title ? /* @__PURE__ */ createElement("title", { id: titleId }, title) : null, nodes.map(([tag, attrs], index) => createElement(tag, { ...attrs, ...absoluteStrokeWidth ? { vectorEffect: "non-scaling-stroke" } : {}, key: index })), children);
  });
  Icon.displayName = displayName;
  return Icon;
}
export {
  createIcon
};
