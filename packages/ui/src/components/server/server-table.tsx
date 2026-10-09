// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Server, ServerStatus, ServerActivity, ServerMetric, ServerSettingsValues } from './types.js';
export interface ServerTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Server[];
    emptyMessage?: string;
}
export function ServerTable(props: ServerTableProps) { return <DomainTable config={config} {...props}/>; }
