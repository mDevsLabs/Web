// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Document, DocumentStatus, DocumentActivity, DocumentMetric, DocumentSettingsValues } from './types.js';
export interface DocumentTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Document[];
    emptyMessage?: string;
}
export function DocumentTable(props: DocumentTableProps) { return <DomainTable config={config} {...props}/>; }
