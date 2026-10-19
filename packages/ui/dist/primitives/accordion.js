"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { Accordion as RAccordion } from "radix-ui";
function Accordion({ items, ...props }) {
  return /* @__PURE__ */ jsx(RAccordion.Root, { type: "single", collapsible: true, ...props, className: "md-accordion", children: items.map((item) => /* @__PURE__ */ jsxs(RAccordion.Item, { value: item.id, disabled: item.disabled, className: "md-accordion-item", children: [
    /* @__PURE__ */ jsx(RAccordion.Header, { children: /* @__PURE__ */ jsxs(RAccordion.Trigger, { className: "md-accordion-trigger", children: [
      item.title,
      /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: "\u2304" })
    ] }) }),
    /* @__PURE__ */ jsx(RAccordion.Content, { className: "md-accordion-content", children: item.content })
  ] }, item.id)) });
}
export {
  Accordion
};
