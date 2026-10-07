"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { DomainForm } from "../../internal/domain.js";
import { config } from "./config.js";
function PurchaseOrderForm({ onSubmit, ...props }) {
  return /* @__PURE__ */ jsx(DomainForm, { config, ...props, onSubmit: (values) => onSubmit(values) });
}
export {
  PurchaseOrderForm
};
