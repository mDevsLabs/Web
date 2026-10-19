"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function Timeline({ events, className, ...props }) {
  return /* @__PURE__ */ jsx("ol", { ...props, className: cx("md-timeline", className), children: events.map((event) => /* @__PURE__ */ jsxs("li", { children: [
    /* @__PURE__ */ jsx("span", { className: "md-timeline-dot", "aria-hidden": "true" }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("strong", { children: event.title }),
      event.description && /* @__PURE__ */ jsx("p", { children: event.description }),
      /* @__PURE__ */ jsx("time", { className: "md-muted", dateTime: event.date, children: event.date })
    ] })
  ] }, event.id)) });
}
export {
  Timeline
};
