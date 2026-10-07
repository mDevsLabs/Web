// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { LogEntry, LogEntryStatus, LogEntryActivity, LogEntryMetric, LogEntrySettingsValues } from './types.js';
export interface LogEntryListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly LogEntry[];
    onSelect?: (item: LogEntry) => void;
    emptyMessage?: string;
}
export function LogEntryList({ onSelect, ...props }: LogEntryListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as LogEntry) : undefined}/>; }
