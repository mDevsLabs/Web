// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { LogEntry, LogEntryStatus, LogEntryActivity, LogEntryMetric, LogEntrySettingsValues } from './types.js';
export interface LogEntryOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly LogEntry[];
    metrics: readonly LogEntryMetric[];
}
export function LogEntryOverview(props: LogEntryOverviewProps) { return <DomainOverview config={config} {...props}/>; }
