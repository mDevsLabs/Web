"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId, useMemo, useState } from "react";
import { cx } from "./utils.js";
const format = (value) => value === void 0 || value === null || value === "" ? "\u2014" : String(value);
function Frame({ config, title, description, actions, className, children, ...props }) {
  const id = useId();
  return /* @__PURE__ */ jsxs("section", { ...props, className: cx("md-glass md-domain", className), "aria-labelledby": props["aria-label"] ? void 0 : id, children: [
    /* @__PURE__ */ jsxs("header", { className: "md-domain-heading", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { id, children: title ?? config.label }),
        (description ?? config.description) && /* @__PURE__ */ jsx("p", { className: "md-muted", children: description ?? config.description })
      ] }),
      actions && /* @__PURE__ */ jsx("div", { children: actions })
    ] }),
    children
  ] });
}
function DomainCard({ config, item, ...props }) {
  return /* @__PURE__ */ jsx(Frame, { config, ...props, title: props.title ?? format(item[config.titleKey]), children: /* @__PURE__ */ jsx("dl", { className: "md-description-list", children: config.fields.filter((f) => f.key !== config.titleKey).map((f) => /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("dt", { children: f.label }),
    /* @__PURE__ */ jsx("dd", { children: f.kind === "status" ? /* @__PURE__ */ jsx("span", { className: "md-badge", children: format(item[f.key]) }) : format(item[f.key]) })
  ] }, f.key)) }) });
}
function DomainList({ config, items, onSelect, emptyMessage = "Aucun \xE9l\xE9ment.", ...props }) {
  return /* @__PURE__ */ jsx(Frame, { config, ...props, children: items.length ? /* @__PURE__ */ jsx("ul", { className: "md-item-list", children: items.map((item, i) => /* @__PURE__ */ jsx("li", { children: onSelect ? /* @__PURE__ */ jsxs("button", { type: "button", className: "md-list-action", onClick: () => onSelect(item), children: [
    /* @__PURE__ */ jsx("strong", { children: format(item[config.titleKey]) }),
    /* @__PURE__ */ jsx("span", { className: "md-muted", children: config.fields.filter((f) => f.key !== config.titleKey).map((f) => format(item[f.key])).join(" \xB7 ") })
  ] }) : /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("strong", { children: format(item[config.titleKey]) }),
    /* @__PURE__ */ jsx("p", { className: "md-muted", children: config.fields.filter((f) => f.key !== config.titleKey).map((f) => format(item[f.key])).join(" \xB7 ") })
  ] }) }, item.id ?? i)) }) : /* @__PURE__ */ jsx("p", { className: "md-muted", children: emptyMessage }) });
}
function DomainTable({ config, items, emptyMessage = "Aucun \xE9l\xE9ment.", ...props }) {
  const [sort, setSort] = useState(null);
  const ordered = useMemo(() => sort ? [...items].sort((a, b) => {
    const x = a[sort.key], y = b[sort.key];
    const n = typeof x === "number" && typeof y === "number" ? x - y : format(x).localeCompare(format(y), void 0, { numeric: true });
    return sort.ascending ? n : -n;
  }) : items, [items, sort]);
  return /* @__PURE__ */ jsx(Frame, { config, ...props, children: /* @__PURE__ */ jsx("div", { className: "md-table-scroll", role: "region", "aria-label": `Tableau : ${props.title ?? config.label}`, tabIndex: 0, children: /* @__PURE__ */ jsxs("table", { className: "md-table", children: [
    /* @__PURE__ */ jsx("caption", { className: "md-sr-only", children: props.title ?? config.label }),
    /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { children: config.fields.map((f) => /* @__PURE__ */ jsx("th", { scope: "col", "aria-sort": sort?.key === f.key ? sort.ascending ? "ascending" : "descending" : "none", children: /* @__PURE__ */ jsxs("button", { type: "button", className: "md-sort", onClick: () => setSort({ key: f.key, ascending: sort?.key === f.key ? !sort.ascending : true }), children: [
      f.label,
      /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: sort?.key === f.key ? sort.ascending ? " \u2191" : " \u2193" : " \u2195" })
    ] }) }, f.key)) }) }),
    /* @__PURE__ */ jsx("tbody", { children: ordered.length ? ordered.map((item, i) => /* @__PURE__ */ jsx("tr", { children: config.fields.map((f) => /* @__PURE__ */ jsx("td", { children: format(item[f.key]) }, f.key)) }, item.id ?? i)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: config.fields.length, children: emptyMessage }) }) })
  ] }) }) });
}
function DomainForm({ config, initialValues, onSubmit, submitLabel = "Enregistrer", pending = false, ...props }) {
  const id = useId();
  function submit(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const values = {};
    for (const field of config.fields) {
      const raw = String(data.get(field.key) ?? "").trim();
      values[field.key] = field.kind === "number" ? raw === "" ? void 0 : Number(raw) : raw;
    }
    onSubmit(values);
  }
  return /* @__PURE__ */ jsx(Frame, { config, ...props, children: /* @__PURE__ */ jsxs("form", { className: "md-form-grid", onSubmit: submit, "aria-busy": pending, children: [
    /* @__PURE__ */ jsxs("fieldset", { disabled: pending, className: "md-fieldset", children: [
      /* @__PURE__ */ jsx("legend", { className: "md-sr-only", children: props.title ?? config.label }),
      config.fields.map((f) => /* @__PURE__ */ jsxs("div", { className: "md-field", children: [
        /* @__PURE__ */ jsxs("label", { htmlFor: `${id}-${f.key}`, children: [
          f.label,
          f.required && /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: " *" })
        ] }),
        f.kind === "status" ? /* @__PURE__ */ jsx("select", { id: `${id}-${f.key}`, name: f.key, className: "md-input", defaultValue: initialValues?.[f.key] ?? f.options?.[0], required: f.required, children: f.options?.map((o) => /* @__PURE__ */ jsx("option", { value: o, children: o }, o)) }) : /* @__PURE__ */ jsx("input", { className: "md-input", id: `${id}-${f.key}`, name: f.key, type: f.kind, step: f.kind === "number" ? "any" : void 0, defaultValue: initialValues?.[f.key], required: f.required })
      ] }, f.key))
    ] }),
    /* @__PURE__ */ jsx("button", { className: "md-button", type: "submit", disabled: pending, children: pending ? "Enregistrement\u2026" : submitLabel })
  ] }) });
}
function DomainFilters({ config, query, status, onQueryChange, onStatusChange, ...props }) {
  const id = useId();
  const field = config.fields.find((f) => f.kind === "status");
  return /* @__PURE__ */ jsx(Frame, { config, ...props, children: /* @__PURE__ */ jsxs("div", { className: "md-filter-bar", children: [
    /* @__PURE__ */ jsxs("div", { className: "md-field", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: `${id}-query`, children: "Rechercher" }),
      /* @__PURE__ */ jsx("input", { className: "md-input", id: `${id}-query`, type: "search", value: query, onChange: (e) => onQueryChange(e.target.value) })
    ] }),
    field && /* @__PURE__ */ jsxs("div", { className: "md-field", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: `${id}-status`, children: field.label }),
      /* @__PURE__ */ jsxs("select", { className: "md-input", id: `${id}-status`, value: status ?? "", onChange: (e) => onStatusChange?.(e.target.value), disabled: !onStatusChange, children: [
        /* @__PURE__ */ jsx("option", { value: "", children: "Tous les statuts" }),
        field.options?.map((o) => /* @__PURE__ */ jsx("option", { children: o }, o))
      ] })
    ] }),
    /* @__PURE__ */ jsx("button", { type: "button", className: "md-button md-button-ghost", onClick: () => {
      onQueryChange("");
      onStatusChange?.("");
    }, children: "R\xE9initialiser" })
  ] }) });
}
function DomainTimeline({ config, events, emptyMessage = "Aucune activit\xE9.", ...props }) {
  return /* @__PURE__ */ jsx(Frame, { config, ...props, children: events.length ? /* @__PURE__ */ jsx("ol", { className: "md-timeline", children: events.map((event) => /* @__PURE__ */ jsxs("li", { children: [
    /* @__PURE__ */ jsx("span", { className: "md-timeline-dot", "aria-hidden": "true" }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("strong", { children: event.title }),
      event.description && /* @__PURE__ */ jsx("p", { children: event.description }),
      /* @__PURE__ */ jsx("time", { dateTime: event.date, className: "md-muted", children: event.date })
    ] })
  ] }, event.id)) }) : /* @__PURE__ */ jsx("p", { className: "md-muted", children: emptyMessage }) });
}
function DomainStats({ config, metrics, ...props }) {
  return /* @__PURE__ */ jsx(Frame, { config, ...props, children: /* @__PURE__ */ jsx("dl", { className: "md-stat-grid", children: metrics.map((metric) => /* @__PURE__ */ jsxs("div", { className: "md-stat", "data-tone": metric.tone, children: [
    /* @__PURE__ */ jsx("dt", { children: metric.label }),
    /* @__PURE__ */ jsx("dd", { children: metric.value }),
    metric.change && /* @__PURE__ */ jsx("p", { children: metric.change })
  ] }, metric.id)) }) });
}
function DomainEmptyState({ config, message = "Les \xE9l\xE9ments appara\xEEtront ici une fois cr\xE9\xE9s.", actionLabel, onAction, ...props }) {
  return /* @__PURE__ */ jsx(Frame, { config, ...props, children: /* @__PURE__ */ jsxs("div", { className: "md-empty", children: [
    /* @__PURE__ */ jsx("span", { className: "md-empty-mark", "aria-hidden": "true", children: "\u25C7" }),
    /* @__PURE__ */ jsx("p", { children: message }),
    onAction && actionLabel && /* @__PURE__ */ jsx("button", { className: "md-button", type: "button", onClick: onAction, children: actionLabel })
  ] }) });
}
function DomainSettings({ config, values, onChange, ...props }) {
  const id = useId();
  return /* @__PURE__ */ jsx(Frame, { config, ...props, children: /* @__PURE__ */ jsx("div", { className: "md-settings", children: config.settings.map((setting) => /* @__PURE__ */ jsxs("div", { className: "md-setting", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("label", { htmlFor: `${id}-${setting.key}`, children: setting.label }),
      /* @__PURE__ */ jsx("p", { className: "md-muted", id: `${id}-${setting.key}-hint`, children: setting.description })
    ] }),
    /* @__PURE__ */ jsx("input", { className: "md-switch-native", type: "checkbox", role: "switch", id: `${id}-${setting.key}`, "aria-describedby": `${id}-${setting.key}-hint`, checked: Boolean(values[setting.key]), onChange: (e) => onChange(setting.key, e.target.checked) })
  ] }, setting.key)) }) });
}
function DomainOverview({ config, items, metrics, ...props }) {
  return /* @__PURE__ */ jsxs(Frame, { config, ...props, children: [
    /* @__PURE__ */ jsx("dl", { className: "md-stat-grid", children: metrics.map((m) => /* @__PURE__ */ jsxs("div", { className: "md-stat", children: [
      /* @__PURE__ */ jsx("dt", { children: m.label }),
      /* @__PURE__ */ jsx("dd", { children: m.value })
    ] }, m.id)) }),
    /* @__PURE__ */ jsx("ul", { className: "md-item-list", children: items.slice(0, 5).map((item, i) => /* @__PURE__ */ jsxs("li", { children: [
      /* @__PURE__ */ jsx("strong", { children: format(item[config.titleKey]) }),
      /* @__PURE__ */ jsx("p", { className: "md-muted", children: config.fields.filter((f) => f.key !== config.titleKey).slice(0, 2).map((f) => format(item[f.key])).join(" \xB7 ") })
    ] }, item.id ?? i)) }),
    items.length === 0 && /* @__PURE__ */ jsx("p", { className: "md-muted", children: "Aucun \xE9l\xE9ment." })
  ] });
}
export {
  DomainCard,
  DomainEmptyState,
  DomainFilters,
  DomainForm,
  DomainList,
  DomainOverview,
  DomainSettings,
  DomainStats,
  DomainTable,
  DomainTimeline
};
