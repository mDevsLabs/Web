"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { cx } from "../internal/utils.js";
function SearchResults({ label, query, items, pending = false, className, ...props }) {
  const id = useId();
  return /* @__PURE__ */ jsxs("section", { ...props, className: cx("md-search-results", className), "aria-labelledby": id, "aria-busy": pending || void 0, children: [
    /* @__PURE__ */ jsx("h2", { id, children: label }),
    /* @__PURE__ */ jsx("p", { role: "status", className: "md-muted", children: pending ? "Recherche en cours\u2026" : `${items.length} r\xE9sultat(s)${query ? " pour \xAB " + query + " \xBB" : ""}` }),
    /* @__PURE__ */ jsx("ol", { children: items.map((item) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("article", { children: [
      /* @__PURE__ */ jsx("h3", { children: /* @__PURE__ */ jsx("a", { href: item.href, children: item.title }) }),
      item.excerpt && /* @__PURE__ */ jsx("p", { children: item.excerpt })
    ] }) }, item.id)) }),
    !pending && !items.length && /* @__PURE__ */ jsx("p", { children: "Aucun r\xE9sultat. Essayez une recherche plus large." })
  ] });
}
export {
  SearchResults
};
