"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { Tabs as RTabs } from "radix-ui";
function Tabs({ items, label, defaultValue, ...props }) {
  return /* @__PURE__ */ jsxs(RTabs.Root, { defaultValue: defaultValue ?? items[0]?.id, ...props, className: "md-tabs", children: [
    /* @__PURE__ */ jsx(RTabs.List, { "aria-label": label, className: "md-tab-list", children: items.map((item) => /* @__PURE__ */ jsx(RTabs.Trigger, { value: item.id, disabled: item.disabled, className: "md-tab", children: item.label }, item.id)) }),
    items.map((item) => /* @__PURE__ */ jsx(RTabs.Content, { value: item.id, className: "md-tab-panel", children: item.content }, item.id))
  ] });
}
export {
  Tabs
};
