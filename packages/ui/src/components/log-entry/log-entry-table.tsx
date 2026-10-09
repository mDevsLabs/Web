// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { LogEntry, LogEntryStatus, LogEntryActivity, LogEntryMetric, LogEntrySettingsValues } from './types.js';
export interface LogEntryTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly LogEntry[];
    emptyMessage?: string;
}
export function LogEntryTable(props: LogEntryTableProps) { return <DomainTable config={config} {...props}/>; }
