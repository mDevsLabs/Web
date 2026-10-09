// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { SleepSession, SleepSessionStatus, SleepSessionActivity, SleepSessionMetric, SleepSessionSettingsValues } from './types.js';
export interface SleepSessionTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly SleepSession[];
    emptyMessage?: string;
}
export function SleepSessionTable(props: SleepSessionTableProps) { return <DomainTable config={config} {...props}/>; }
