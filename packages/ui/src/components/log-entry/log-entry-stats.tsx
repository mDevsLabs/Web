// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { LogEntry, LogEntryStatus, LogEntryActivity, LogEntryMetric, LogEntrySettingsValues } from './types.js';
export interface LogEntryStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly LogEntryMetric[];
}
export function LogEntryStats(props: LogEntryStatsProps) { return <DomainStats config={config} {...props}/>; }
