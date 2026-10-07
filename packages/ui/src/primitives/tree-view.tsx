'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface TreeNode {
    id: string;
    label: string;
    children?: readonly TreeNode[];
}
export interface TreeViewProps {
    nodes: readonly TreeNode[];
    onSelect?: (node: TreeNode) => void;
    label: string;
}
export function TreeView({ nodes, onSelect, label }: TreeViewProps) { function branch(items: readonly TreeNode[]): ReactNode { return <ul className="md-tree">{items.map(node => <li key={node.id}>{node.children?.length ? <details><summary>{node.label}</summary>{branch(node.children)}</details> : onSelect ? <button type="button" className="md-button md-button-ghost" onClick={() => onSelect(node)}>{node.label}</button> : <span>{node.label}</span>}</li>)}</ul>; } return <nav aria-label={label}>{branch(nodes)}</nav>; }
