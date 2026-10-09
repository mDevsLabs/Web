// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Document, DocumentStatus, DocumentActivity, DocumentMetric, DocumentSettingsValues } from './types.js';
export interface DocumentListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Document[];
    onSelect?: (item: Document) => void;
    emptyMessage?: string;
}
export function DocumentList({ onSelect, ...props }: DocumentListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Document) : undefined}/>; }
